import { inviteDispatcher } from "@/app/(app)/team/actions";

export default function InviteDispatcherForm() {
  return (
    <form
      action={inviteDispatcher}
      className="rounded-lg border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        Invite dispatcher
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Sends a magic link invite email and creates their profile.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            name="full_name"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            required
            type="email"
            name="email"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Send invite
      </button>
    </form>
  );
}
