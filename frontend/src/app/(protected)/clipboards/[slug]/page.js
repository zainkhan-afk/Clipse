"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Copy, Trash2, Paperclip, ClipboardPaste, SendHorizontal, Check, ImageIcon, Type, X, FileQuestion } from "lucide-react";

import TooltipWrapper from "@/components/primitives/TooltipWrapper";
import ClipboardAbout from "@/components/ClipboardAbout";
import ClipboardSettings from "@/components/ClipboardSettings";
import DeleteMessageConfirmationModal from "@/components/modals/DeleteMessage";

import { getClipboardData, sendToClipboard, deleteMessage } from "@/api/clipboard";
import { parseServerDate } from "@/lib/datetime";

// Mobile Safari only accepts image/png on the clipboard, so normalize whatever
// format the image was stored in (JPEG/WebP/…) to PNG via a canvas before copying.
async function toPngBlob(blob) {
  if (blob.type === "image/png") return blob;
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("PNG conversion failed");
    return png;
  } finally {
    bitmap.close?.();
  }
}

// How often to quietly poll for new clipboard items (ms).
const POLL_INTERVAL_MS = 4000;

export default function ClipboardPage() {
  const params = useParams();
  const { slug } = params;
  const fileInputRef = useRef(null);
  const copyNoteTimer = useRef(null);

  const [textToSend, setTextToSend] = useState("");
  const [pendingImages, setPendingImages] = useState([]); // staged, not yet uploaded
  const [sending, setSending] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [refreshMessages, setRefreshMessages] = useState(false);
  const [messageDeleteModalOpen, setMessageDeleteModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copyNote, setCopyNote] = useState(""); // transient feedback toast (mobile has no hover tooltips)
  const [clipboardData, setClipboardData] = useState({});
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "notfound" | "error"

  // Release object URLs for any still-staged previews when leaving the page.
  const pendingRef = useRef([]);
  useEffect(() => {
    pendingRef.current = pendingImages;
  }, [pendingImages]);
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);
  useEffect(() => () => { if (copyNoteTimer.current) clearTimeout(copyNoteTimer.current); }, []);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!slug) return;
      try {
        const data = await getClipboardData(slug);
        if (cancelled) return;
        setClipboardData(data);
        setStatus("ready");
        setRefreshMessages(false);
      } catch (err) {
        // A bad/deleted slug 404s; anything else is a load error. Either way, render
        // an explicit state instead of leaving an empty, half-loaded page.
        if (!cancelled) setStatus(err?.status === 404 ? "notfound" : "error");
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [slug, refreshMessages]);

  // Auto-refresh: quietly poll for new items so entries added from another device
  // appear on their own. Only runs while the tab is visible, and refreshes right
  // away when the user returns to it. This is a silent update — no loading state —
  // so existing items stay put and only genuinely new ones animate in.
  useEffect(() => {
    if (!slug || status !== "ready") return;

    let cancelled = false;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = await getClipboardData(slug);
        if (!cancelled) setClipboardData(data);
      } catch (err) {
        // If the clipboard was deleted while open, surface not-found; otherwise
        // ignore the transient failure and let the next tick retry.
        if (!cancelled && err?.status === 404) setStatus("notfound");
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [slug, status]);

  const sendText = async (text) => {
    const formData = new FormData();
    formData.append("content_type", "text");
    formData.append("content", text);
    await sendToClipboard(formData, slug);
  };

  const sendImage = async (file) => {
    const formData = new FormData();
    formData.append("content_type", "image");
    formData.append("image", file);
    await sendToClipboard(formData, slug);
  };

  // Images are staged in the composer as previews; nothing uploads until Send.
  const stageImages = (files) => {
    if (!files.length) return;
    setPendingImages((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  };

  const removePendingImage = (id) => {
    setPendingImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const imagesFromClipboard = (e) => {
    const files = [];
    for (const item of e.clipboardData?.items ?? []) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    return files;
  };

  const handleSend = async () => {
    const text = textToSend.trim();
    if (!text && pendingImages.length === 0) return;

    setSending(true);
    try {
      for (const img of pendingImages) {
        await sendImage(img.file);
        URL.revokeObjectURL(img.url);
      }
      if (text) await sendText(text);

      setPendingImages([]);
      setTextToSend("");
      setRefreshMessages(true);
    } catch (err) {
      console.error("Failed to send to clipboard", err);
    } finally {
      setSending(false);
    }
  };

  // Paste anywhere on the page: images get staged, text is added straight away.
  const handlePaste = (e) => {
    const images = imagesFromClipboard(e);
    if (images.length) {
      e.preventDefault();
      stageImages(images);
      return;
    }

    const text = e.clipboardData.getData("text/plain");
    if (text?.trim()) {
      e.preventDefault();
      sendText(text)
        .then(() => setRefreshMessages(true))
        .catch((err) => console.error("Failed to send message to clipboard", err));
    }
  };

  // Paste inside the textarea: stage images, let plain text paste natively.
  const handleTextareaPaste = (e) => {
    e.stopPropagation(); // don't also trigger the page-level quick-add
    const images = imagesFromClipboard(e);
    if (images.length) {
      e.preventDefault(); // a textarea can't hold an image
      stageImages(images);
    }
  };

  // Explicit "paste" for touch devices: mobile browsers don't deliver image files
  // through the `paste` event, so read the clipboard directly on a button tap.
  // Needs HTTPS + a user gesture and may prompt for clipboard permission.
  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      showCopyNote("Can't read the clipboard here — use the attach button instead.");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      const files = [];
      let pastedText = "";
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = (imageType.split("/")[1] || "png").split("+")[0];
          files.push(new File([blob], `pasted-${Date.now()}.${ext}`, { type: blob.type }));
        } else if (item.types.includes("text/plain")) {
          const blob = await item.getType("text/plain");
          pastedText = (await blob.text()).trim();
        }
      }
      if (files.length) {
        stageImages(files);
      } else if (pastedText) {
        setTextToSend((prev) => (prev ? `${prev}${pastedText}` : pastedText));
      } else {
        showCopyNote("Nothing to paste from the clipboard.");
      }
    } catch (err) {
      console.error("Failed to paste from clipboard:", err);
      showCopyNote("Couldn't read the clipboard. Grant clipboard access or use attach.");
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => flashCopied(id));
  };

  const handleCopyImage = async (messageId) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/images/${messageId}`;

    // Writing an image to the clipboard needs a secure context (HTTPS) plus the async
    // Clipboard API. Over plain HTTP (e.g. testing on a phone via the LAN) these are
    // missing, so guide the user to the native long-press gesture instead of failing
    // silently.
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      showCopyNote("Long-press the image to copy or save it.");
      return;
    }

    try {
      // Images live in a private blob store; fetch them through our authenticated
      // proxy (cookie-auth, same-origin in prod). Build the ClipboardItem from a
      // *promise* and call write() synchronously so mobile browsers (iOS Safari
      // especially) keep the tap's user-activation alive while the image downloads
      // and is converted to PNG — the only image type Safari will put on the clipboard.
      const pngBlob = fetch(url, { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("Image fetch failed");
          return res.blob();
        })
        .then(toPngBlob);

      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      flashCopied(messageId);
    } catch (err) {
      console.error("Failed to copy image:", err);
      showCopyNote("Couldn't copy — long-press the image to copy or save it.");
    }
  };

  const flashCopied = (id) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1400);
  };

  const showCopyNote = (text) => {
    setCopyNote(text);
    if (copyNoteTimer.current) clearTimeout(copyNoteTimer.current);
    copyNoteTimer.current = setTimeout(() => setCopyNote(""), 2800);
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

  if (status === "notfound" || status === "error") {
    const notFound = status === "notfound";
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm animate-rise">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <FileQuestion className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            {notFound ? "Clipboard not found" : "Couldn't load this clipboard"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {notFound
              ? "This clipboard doesn't exist or isn't yours. It may have been deleted, or the link is wrong."
              : "Something went wrong loading this clipboard. Check your connection and try again."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Back to dashboard
            </Link>
            {!notFound && (
              <button
                type="button"
                onClick={() => {
                  setStatus("loading");
                  setRefreshMessages((v) => !v);
                }}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      className="flex h-full min-h-0 flex-1 flex-col outline-none"
      onPaste={handlePaste}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
        {/* Header */}
        <div className="flex items-baseline gap-3 animate-rise">
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
                    handleSend();
                  }
                }}
                onPaste={handleTextareaPaste}
              />

              {/* Staged image previews — nothing is uploaded until Send */}
              {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-line px-2 pt-3">
                  {pendingImages.map((img) => (
                    <div key={img.id} className="relative animate-rise">
                      <img
                        src={img.url}
                        alt="Attachment preview"
                        className="h-16 w-16 rounded-lg border border-line object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingImage(img.id)}
                        aria-label="Remove attachment"
                        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-line bg-surface text-muted shadow-[var(--shadow)] transition-colors hover:border-accent hover:text-accent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
                <span className="font-mono text-[11px] text-faint">
                  {pendingImages.length > 0
                    ? `${pendingImages.length} image${pendingImages.length === 1 ? "" : "s"} attached`
                    : "text · image"}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      stageImages(Array.from(e.target.files ?? []));
                      e.target.value = "";
                    }}
                  />
                  <TooltipWrapper label="Paste from clipboard">
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
                    >
                      <ClipboardPaste className="h-[18px] w-[18px]" />
                    </button>
                  </TooltipWrapper>
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
                    onClick={handleSend}
                    disabled={sending || (!textToSend.trim() && pendingImages.length === 0)}
                    className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? "Sending…" : "Send"}
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="min-h-0 flex-1 overflow-y-auto scroll-slim pr-1">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong text-center">
                  <span className="ping-dot mb-4 h-2.5 w-2.5" />
                  <p className="text-sm text-muted">Nothing here yet.</p>
                  <p className="mt-1 text-xs text-faint">
                    Paste text to add it instantly, or paste an image to attach it.
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
                              src={`${process.env.NEXT_PUBLIC_API_URL}/images/${message.id}`}
                              alt="Clipboard image"
                              crossOrigin="use-credentials"
                              className="max-h-80 w-auto rounded-lg border border-line"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between border-t border-line bg-raised/40 px-4 py-2">
                          <span className="flex items-center gap-1.5 font-mono text-[11px] text-faint">
                            {isText ? <Type className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                            {formatter.format(parseServerDate(message.created_at))}
                          </span>
                          <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                            <TooltipWrapper label={copied ? "Copied!" : "Copy"}>
                              <button
                                type="button"
                                onClick={() =>
                                  isText
                                    ? handleCopyText(message.content, message.id)
                                    : handleCopyImage(message.id)
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

      {copyNote && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto max-w-xs rounded-xl border border-line bg-surface px-4 py-2.5 text-center text-sm text-ink shadow-[var(--shadow)]">
            {copyNote}
          </div>
        </div>
      )}
    </div>
  );
}
