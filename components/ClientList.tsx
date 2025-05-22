"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export interface Client {
  id: string;
  name: string;
  description: string | null;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ClientListProps {
  clients: Client[];
  loading: boolean;
  error: string | null;
  currentClientId?: string;
  onSelect: (client: Client) => void;
  onDelete?: (client: Client) => void;
  className?: string;
}

export function ClientList({ clients, loading, error, currentClientId, onSelect, onDelete, className }: ClientListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(client: Client) {
    if (!window.confirm(`Delete client '${client.name}'? This cannot be undone.`)) return;
    setDeletingId(client.id);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete client");
      }
      if (onDelete) onDelete(client);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className={className}>Loading clients...</div>;
  }
  if (error) {
    return <div className={className + " text-red-600"}>Error: {error}</div>;
  }
  if (!clients || clients.length === 0) {
    return <div className={className}>No clients found.</div>;
  }
  return (
    <div className={className + " space-y-2"}>
      {clients.map((client) => (
        <Card
          key={client.id}
          className={
            "flex items-center justify-between p-4 cursor-pointer border group " +
            (client.id === currentClientId
              ? "border-blue-600 bg-blue-50"
              : "hover:border-blue-400")
          }
          onClick={e => {
            // Prevent select if clicking delete
            if ((e.target as HTMLElement).closest('.delete-btn')) return;
            onSelect(client);
          }}
        >
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {client.name}
              {client.id === currentClientId && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">Current</span>
              )}
            </div>
            {client.description && (
              <div className="text-sm text-gray-500">{client.description}</div>
            )}
          </div>
          <button
            className="delete-btn ml-4 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Delete client"
            onClick={e => {
              e.stopPropagation();
              handleDelete(client);
            }}
            disabled={deletingId === client.id}
            aria-label={`Delete client ${client.name}`}
          >
            <XCircle className="w-5 h-5" />
          </button>
        </Card>
      ))}
    </div>
  );
} 