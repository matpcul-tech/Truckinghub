"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Broker, Carrier, Driver, Equipment } from "@/lib/types";

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

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function loadBaseData() {
      const [{ data: carrierData }, { data: brokerData }] = await Promise.all([
        supabase
          .from("carriers")
          .select("*")
          .eq("status", "active")
          .order("company_name", { ascending: true }),
        supabase.from("brokers").select("*").order("name", { ascending: true }),
      ]);
      setCarriers((carrierData as Carrier[]) || []);
      setBrokers((brokerData as Broker[]) || []);
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

  const previewRatePerMile =
    rate && loadedMiles && Number(loadedMiles) > 0
      ? (Number(rate) / Number(loadedMiles)).toFixed(2)
      : "0.00";

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
              onChange={(e) => setBrokerId(e.target.value)}
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
              value={`$${previewRatePerMile}`}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Rate confirmation (optional)
          </label>
          <input
            type="file"
            onChange={(e) => setRateconFile(e.target.files?.[0] || null)}
            className="mt-1 text-sm text-slate-600"
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !carrierId}
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
