"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Copy, Trash2, Paperclip, SendHorizontal, Check, ImageIcon, Type } from "lucide-react";

import TooltipWrapper from "@/components/primitives/TooltipWrapper";
import ClipboardAbout from "@/components/ClipboardAbout";
import ClipboardSettings from "@/components/ClipboardSettings";
import DeleteMessageConfirmationModal from "@/components/modals/DeleteMessage";

import { getClipboardData, sendToClipboard, deleteMessage } from "@/api/clipboard";

export default function ClipboardPage() {
  const params = useParams();
  const { slug } = params;
  const fileInputRef = useRef(null);

  const [textToSend, setTextToSend] = useState("");
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [refreshMessages, setRefreshMessages] = useState(false);
  const [messageDeleteModalOpen, setMessageDeleteModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [clipboardData, setClipboardData] = useState({});

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    async function fetchData() {
      if (slug) {
        const data = await getClipboardData(slug);
        setClipboardData(data);
        setRefreshMessages(false);
      }
    }
    fetchData();
  }, [slug, refreshMessages]);

  const handleSendTextToClipboard = async (text) => {
    if (!text) return;
    try {
      const formData = new FormData();
      formData.append("content_type", "text");
      formData.append("content", text);
      await sendToClipboard(formData, slug);
      setTextToSend("");
      setRefreshMessages(true);
    } catch (err) {
      console.error("Failed to send message to clipboard", err);
    }
  };

  const handleSendImageToClipboard = async (file) => {
    try {
      const formData = new FormData();
      formData.append("content_type", "image");
      formData.append("image", file);
      await sendToClipboard(formData, slug);
      setRefreshMessages(true);
    } catch (err) {
      console.error("Failed to send image", err);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        handleSendImageToClipboard(file);
        return;
      }
      if (item.kind === "string" && item.type === "text/plain") {
        item.getAsString((text) => {
          if (text.trim()) handleSendTextToClipboard(text);
        });
        return;
      }
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => flashCopied(id));
  };

  const handleCopyImage = async (imageUrl, id) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${imageUrl}`, {
        credentials: "include",
      });
      const blob = await response.blob();
      const clipboardItem = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([clipboardItem]);
      flashCopied(id);
    } catch (err) {
      console.error("Failed to copy image:", err);
    }
  };

  const flashCopied = (id) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1400);
  };

  const handleOpenMessageDeleteModal = (message) => {
    setMessageToDelete(message);
    setMessageDeleteModalOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !slug) return;
    try {
      await deleteMessage(slug, messageToDelete.id);
      setClipboardData((prev) => ({
        ...prev,
        clipboard_data: prev.clipboard_data.filter((m) => m.id !== messageToDelete.id),
      }));
      setMessageToDelete(null);
      setMessageDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const messages = clipboardData?.clipboard_data ?? [];

  return (
    <div
      tabIndex={0}
      className="flex h-full min-h-0 flex-1 flex-col outline-none"
      onPaste={handlePaste}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
        {/* Header */}
        <div className="flex items-baseline gap-3 animate-rise">
          <span className="font-mono text-sm text-faint">#{slug}</span>
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {clipboardData?.clipboard?.name ?? "Clipboard"}
          </h1>
          <span className="ml-auto hidden font-mono text-xs text-faint sm:block">
            {messages.length} {messages.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
          {/* Main column */}
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {/* Composer */}
            <div className="rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow)]">
              <textarea
                className="h-24 w-full resize-none rounded-xl bg-transparent p-2 font-mono text-sm text-ink outline-none placeholder:text-faint"
                placeholder="Type or paste anything…  (⌘/Ctrl + Enter to send)"
                value={textToSend}
                onChange={(e) => setTextToSend(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSendTextToClipboard(textToSend);
                  }
                }}
                onPaste={(e) => e.stopPropagation()}
              />
              <div className="flex items-center justify-between border-t border-line pt-2">
                <span className="font-mono text-[11px] text-faint">text · image</span>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSendImageToClipboard(file);
                      e.target.value = "";
                    }}
                  />
                  <TooltipWrapper label="Attach image">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
                    >
                      <Paperclip className="h-[18px] w-[18px]" />
                    </button>
                  </TooltipWrapper>
                  <button
                    type="button"
                    onClick={() => handleSendTextToClipboard(textToSend)}
                    disabled={!textToSend.trim()}
                    className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Send
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="min-h-0 flex-1 overflow-y-auto scroll-slim pr-1">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong text-center">
                  <span className="blip-dot mb-4 h-2.5 w-2.5" />
                  <p className="text-sm text-muted">Nothing here yet.</p>
                  <p className="mt-1 text-xs text-faint">
                    Paste anywhere on this page to add your first item.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {messages.map((message, i) => {
                    const isText = message.content_type === "text";
                    const copied = copiedId === message.id;
                    return (
                      <li
                        key={message.id}
                        style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                        className="group animate-rise overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]"
                      >
                        <div className="p-4">
                          {isText ? (
                            <p className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-ink">
                              {message.content}
                            </p>
                          ) : (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}/${message.content}`}
                              alt="Clipboard image"
                              className="max-h-80 w-auto rounded-lg border border-line"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between border-t border-line bg-raised/40 px-4 py-2">
                          <span className="flex items-center gap-1.5 font-mono text-[11px] text-faint">
                            {isText ? <Type className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                            {formatter.format(new Date(message.created_at))}
                          </span>
                          <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                            <TooltipWrapper label={copied ? "Copied!" : "Copy"}>
                              <button
                                type="button"
                                onClick={() =>
                                  isText
                                    ? handleCopyText(message.content, message.id)
                                    : handleCopyImage(message.content, message.id)
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
                              >
                                {copied ? (
                                  <Check className="h-4 w-4 text-accent" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </TooltipWrapper>
                            <TooltipWrapper label="Delete">
                              <button
                                type="button"
                                onClick={() => handleOpenMessageDeleteModal(message)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </TooltipWrapper>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* About + Settings */}
          <div className="flex flex-col gap-4 lg:w-72 lg:shrink-0">
            <ClipboardAbout clipboard={clipboardData?.clipboard} count={messages.length} />
            <ClipboardSettings
              clipboard={clipboardData?.clipboard}
              count={messages.length}
              onRefresh={() => setRefreshMessages(true)}
            />
          </div>
        </div>
      </div>

      <DeleteMessageConfirmationModal
        isOpen={messageDeleteModalOpen}
        onClose={() => setMessageDeleteModalOpen(false)}
        onConfirm={handleDeleteMessage}
      />
    </div>
  );
}
