"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowPathIcon,
  EyeIcon,
  ChevronDownIcon,
} from "@/components/ui/icons";

interface ApiCredentialsCardProps {
  websiteId: string;
  websiteName: string;
  apiKey: string;
  webhookSecret: string | null;
}

export function ApiCredentialsCard({
  websiteId,
  websiteName,
  apiKey,
  webhookSecret,
}: ApiCredentialsCardProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm("Are you sure you want to regenerate the API key? The old key will stop working immediately.")) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}/regenerate-key`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate key");
      }

      router.refresh();
    } catch (err) {
      console.error("Failed to regenerate key:", err);
      alert("Failed to regenerate API key. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const maskedKey = apiKey.substring(0, 15) + "••••••••••••••••••••••••••••••••";

  const envVarsText = `ONEBOOKING_API_URL=https://db.onebooking.co
ONEBOOKING_API_KEY=${apiKey}
WEBSITE_ID=${websiteId}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">API Credentials</h3>
        <p className="text-sm text-gray-500">
          Use these credentials to connect {websiteName} to OneBooking
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto">
              {showApiKey ? apiKey : maskedKey}
            </code>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="p-2.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title={showApiKey ? "Hide" : "Show"}
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCopy(apiKey, "apiKey")}
              className="p-2.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Copy"
            >
              {copiedField === "apiKey" ? (
                <CheckIcon className="w-4 h-4 text-green-600" />
              ) : (
                <DocumentDuplicateIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Webhook Secret */}
        {webhookSecret && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto">
                {webhookSecret}
              </code>
              <button
                onClick={() => handleCopy(webhookSecret, "webhookSecret")}
                className="p-2.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Copy"
              >
                {copiedField === "webhookSecret" ? (
                  <CheckIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <DocumentDuplicateIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Website ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website ID
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-800">
              {websiteId}
            </code>
            <button
              onClick={() => handleCopy(websiteId, "websiteId")}
              className="p-2.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Copy"
            >
              {copiedField === "websiteId" ? (
                <CheckIcon className="w-4 h-4 text-green-600" />
              ) : (
                <DocumentDuplicateIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* API URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API URL
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-800">
              https://db.onebooking.co
            </code>
            <button
              onClick={() => handleCopy("https://db.onebooking.co", "apiUrl")}
              className="p-2.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Copy"
            >
              {copiedField === "apiUrl" ? (
                <CheckIcon className="w-4 h-4 text-green-600" />
              ) : (
                <DocumentDuplicateIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Copy All Env Vars */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => handleCopy(envVarsText, "envVars")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-medium hover:bg-blue-100 transition-colors"
          >
            {copiedField === "envVars" ? (
              <>
                <CheckIcon className="w-4 h-4" />
                Copied All Environment Variables!
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="w-4 h-4" />
                Copy All as Environment Variables
              </>
            )}
          </button>
        </div>

        {/* Integration Instructions */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <span>Integration Instructions</span>
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${showInstructions ? "rotate-180" : ""}`}
            />
          </button>

          {showInstructions && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm space-y-4">
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  1. Add to Vercel Environment Variables:
                </p>
                <pre className="bg-slate-800 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs">
{`ONEBOOKING_API_URL=https://db.onebooking.co
ONEBOOKING_API_KEY=${apiKey}
WEBSITE_ID=${websiteId}`}
                </pre>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">
                  2. API Endpoint:
                </p>
                <pre className="bg-slate-800 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs">
{`POST https://db.onebooking.co/api/bookings/sync
Header: X-API-Key: ${apiKey.substring(0, 20)}...`}
                </pre>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">
                  3. Documentation:
                </p>
                <p className="text-gray-600">
                  See{" "}
                  <a
                    href="https://github.com/lovedesignwork/onebooking-dashboard/blob/main/INTEGRATION_HANDOFF_FH.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Integration Guide
                  </a>{" "}
                  for full implementation details.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Regenerate Key */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleRegenerateKey}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "Regenerating..." : "Regenerate API Key"}
          </button>
          <p className="mt-1 text-xs text-gray-500">
            Warning: This will invalidate the current key immediately
          </p>
        </div>
      </div>
    </div>
  );
}
