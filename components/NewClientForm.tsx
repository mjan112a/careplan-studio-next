"use client";
import { useState } from "react";
import { logger } from "@/lib/logging";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Client } from "./ClientList";

interface NewClientFormProps {
  onCreated: (client: Client) => void;
  className?: string;
  disabled?: boolean;
}

export function NewClientForm({ onCreated, className, disabled }: NewClientFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create client");
      }
      const client = await res.json();
      logger.info("Created new client", { clientId: client.id });
      setName("");
      setDescription("");
      onCreated(client);
    } catch (err) {
      logger.error("Failed to create client", {
        error: err instanceof Error ? err.message : String(err),
      });
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = loading || !!disabled;

  return (
    <Card className={className + " p-4"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Client name"
            className="mt-1"
            disabled={isDisabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="mt-1"
            disabled={isDisabled}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit" disabled={isDisabled || !name} className="w-full">
          {loading ? "Creating..." : "Add Client"}
        </Button>
      </form>
    </Card>
  );
} 