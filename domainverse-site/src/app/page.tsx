import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-6">
        <h1 className="text-2xl font-semibold">domainverse.store</h1>
        <p className="text-neutral-500 text-sm">
          Öz layihələrinizi yükləyin, link paylaşın, idarə edin.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="border rounded-md px-4 py-2 text-sm">
            Giriş
          </Link>
          <Link href="/signup" className="bg-black text-white rounded-md px-4 py-2 text-sm">
            Qeydiyyat
          </Link>
        </div>
      </div>
    </div>
  );
}
