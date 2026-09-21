export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Overview</h1>
      <p className="text-muted-foreground mb-8">
        Welcome to your TokoAI Dashboard! Connect your TikTok shop to get started.
      </p>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Messages</div>
          <div className="text-2xl font-bold mt-2">0</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">AI Resolution Rate</div>
          <div className="text-2xl font-bold mt-2">0%</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">Sales Generated</div>
          <div className="text-2xl font-bold mt-2">$0.00</div>
        </div>
      </div>
    </div>
  );
}
