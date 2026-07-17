"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Broker, Carrier, Driver, Equipment, LaneBenchmark } from "@/lib/types";
import { findBenchmark, scoreLoad } from "@/lib/scoring";
import ScorePill from "@/components/loads/score-pill";
import BrokerRiskBanner, {
  brokerRiskRequiresConfirm,
} from "@/components/loads/broker-risk-banner";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export default function NewLoadPage() {
  const router = useRouter();

  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [benchmarks, setBenchmarks] = useState<LaneBenchmark[]>([]);

  const [carrierId, setCarrierId] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destState, setDestState] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [rate, setRate] = useState("");
  const [loadedMiles, setLoadedMiles] = useState("");
  const [deadheadMiles, setDeadheadMiles] = useState("");
  const [rateconFile, setRateconFile] = useState<File | null>(null);
  const [parsingRatecon, setParsingRatecon] = useState(false);
  const [parseErrorMessage, setParseErrorMessage] = useState("");

  const [brokerRiskConfirmed, setBrokerRiskConfirmed] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function loadBaseData() {
      const [{ data: carrierData }, { data: brokerData }, { data: benchmarkData }] =
        await Promise.all([
          supabase
            .from("carriers")
            .select("*")
            .eq("status", "active")
            .order("company_name", { ascending: true }),
          supabase.from("brokers").select("*").order("name", { ascending: true }),
          supabase.from("lane_benchmarks").select("*"),
        ]);
      setCarriers((carrierData as Carrier[]) || []);
      setBrokers((brokerData as Broker[]) || []);
      setBenchmarks((benchmarkData as LaneBenchmark[]) || []);
    }
    loadBaseData();
  }, []);

  useEffect(() => {
    if (!carrierId) {
      setDrivers([]);
      setEquipment([]);
      setDriverId("");
      setEquipmentId("");
      return;
    }

    const supabase = createClient();
    async function loadCarrierData() {
      const [{ data: driverData }, { data: equipmentData }] = await Promise.all([
        supabase.from("drivers").select("*").eq("carrier_id", carrierId),
        supabase.from("equipment").select("*").eq("carrier_id", carrierId),
      ]);
      setDrivers((driverData as Driver[]) || []);
      setEquipment((equipmentData as Equipment[]) || []);
    }
    loadCarrierData();
  }, [carrierId]);

  async function handleRateconUpload(file: File) {
    setRateconFile(file);
    setParsingRatecon(true);
    setParseErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-ratecon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to parse rate confirmation");
      }

      const parsed = await response.json();

      if (parsed.broker_name) {
        const match = brokers.find(
          (broker) =>
            broker.name.trim().toLowerCase() ===
            String(parsed.broker_name).trim().toLowerCase()
        );
        if (match) setBrokerId(match.id);
      }
      if (parsed.origin_city) setOriginCity(parsed.origin_city);
      if (parsed.origin_state) setOriginState(parsed.origin_state);
      if (parsed.dest_city) setDestCity(parsed.dest_city);
      if (parsed.dest_state) setDestState(parsed.dest_state);
      if (parsed.pickup_date) setPickupDate(parsed.pickup_date);
      if (parsed.delivery_date) setDeliveryDate(parsed.delivery_date);
      if (parsed.rate) setRate(String(parsed.rate));
      if (parsed.loaded_miles) setLoadedMiles(String(parsed.loaded_miles));
    } catch (error) {
      setParseErrorMessage(
        error instanceof Error ? error.message : "Failed to parse rate confirmation"
      );
    } finally {
      setParsingRatecon(false);
    }
  }

  const previewRatePerMile =
    rate && loadedMiles && Number(loadedMiles) > 0
      ? Number(rate) / Number(loadedMiles)
      : 0;

  const selectedEquipment = equipment.find((item) => item.id === equipmentId);
  const previewBenchmark =
    carrierId && selectedEquipment && originState && destState && rate && loadedMiles
      ? findBenchmark(benchmarks, originState, destState, selectedEquipment.type)
      : null;
  const previewScore = previewBenchmark
    ? scoreLoad(previewRatePerMile, previewBenchmark)
    : null;

  const selectedBroker = brokers.find((broker) => broker.id === brokerId);
  const brokerConfirmRequired = selectedBroker
    ? brokerRiskRequiresConfirm(selectedBroker.risk_flag)
    : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    let rateconUrl: string | null = null;

    if (rateconFile) {
      const path = `${carrierId}/ratecon-${Date.now()}-${rateconFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("carrier-docs")
        .upload(path, rateconFile);

      if (uploadError) {
        setSaving(false);
        setErrorMessage(uploadError.message);
        return;
      }
      rateconUrl = path;
    }

    const { error } = await supabase
      .from("loads")
      .insert({
        carrier_id: carrierId,
        broker_id: brokerId || null,
        driver_id: driverId || null,
        equipment_id: equipmentId || null,
        origin_city: originCity || null,
        origin_state: originState || null,
        dest_city: destCity || null,
        dest_state: destState || null,
        pickup_date: pickupDate || null,
        delivery_date: deliveryDate || null,
        rate: rate ? Number(rate) : 0,
        loaded_miles: loadedMiles ? Number(loadedMiles) : 0,
        deadhead_miles: deadheadMiles ? Number(deadheadMiles) : 0,
        ratecon_url: rateconUrl,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/loads");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Add load</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Carrier
            </label>
            <select
              required
              value={carrierId}
              onChange={(e) => setCarrierId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">Select an active carrier</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.company_name}
                </option>
              ))}
            </select>
            {carriers.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                No active carriers yet. Activate a carrier first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Broker
            </label>
            <select
              value={brokerId}
              onChange={(e) => {
                setBrokerId(e.target.value);
                setBrokerRiskConfirmed(false);
              }}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">No broker</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBroker && (
            <div className="sm:col-span-2">
              <BrokerRiskBanner
                risk={selectedBroker.risk_flag}
                confirmed={brokerRiskConfirmed}
                onConfirmChange={setBrokerRiskConfirmed}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Driver
            </label>
            <select
              value={driverId}
              disabled={!carrierId}
              onChange={(e) => setDriverId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-50"
            >
              <option value="">No driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Equipment
            </label>
            <select
              value={equipmentId}
              disabled={!carrierId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-50"
            >
              <option value="">No equipment</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.unit_number || item.type || "Unit"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Origin city
            </label>
            <input
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Origin state
            </label>
            <select
              value={originState}
              onChange={(e) => setOriginState(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">-</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Destination city
            </label>
            <input
              value={destCity}
              onChange={(e) => setDestCity(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Destination state
            </label>
            <select
              value={destState}
              onChange={(e) => setDestState(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">-</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Pickup date
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Delivery date
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Rate
            </label>
            <input
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Loaded miles
            </label>
            <input
              type="number"
              step="0.1"
              value={loadedMiles}
              onChange={(e) => setLoadedMiles(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Deadhead miles
            </label>
            <input
              type="number"
              step="0.1"
              value={deadheadMiles}
              onChange={(e) => setDeadheadMiles(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Rate per mile
            </label>
            <input
              readOnly
              value={`$${previewRatePerMile.toFixed(2)}`}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
        </div>

        {carrierId && originState && destState && rate && loadedMiles && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Lane score preview:</span>
            <ScorePill score={previewScore} />
          </div>
        )}

        <div className="rounded-md border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700">
            Upload rate confirmation (optional)
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Uploading a rate confirmation PDF fills in the fields above
            automatically. Review every field before saving, nothing is
            saved automatically from a parse.
          </p>
          <input
            type="file"
            accept="application/pdf"
            disabled={parsingRatecon}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleRateconUpload(file);
            }}
            className="mt-2 text-sm text-slate-600"
          />
          {parsingRatecon && (
            <p className="mt-2 text-sm text-slate-500">
              Reading rate confirmation
            </p>
          )}
          {rateconFile && !parsingRatecon && !parseErrorMessage && (
            <p className="mt-2 text-sm text-emerald-700">
              Parsed {rateconFile.name}. Review the fields above before
              saving.
            </p>
          )}
          {parseErrorMessage && (
            <p className="mt-2 text-sm text-red-600">{parseErrorMessage}</p>
          )}
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={
              saving ||
              !carrierId ||
              (brokerConfirmRequired && !brokerRiskConfirmed)
            }
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving" : "Save load"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/loads")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
