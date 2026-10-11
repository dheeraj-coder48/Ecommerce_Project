"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface DocumentHandle {
  documentId: string;
  documentType: string;
}
type Action =
  | {
      action: "create";
      type: string;
      id: string;
      value: Record<string, unknown>;
    }
  | { action: "set"; type: string; id: string; path: string; value: unknown }
  | { action: "publish" | "discard" | "delete"; type: string; id: string };
const changedEvent = "admin-sanity:changed";
const pendingWrites = new Map<string, Promise<unknown>>();
const documentRequests = new Map<
  string,
  Promise<Record<string, unknown> | null>
>();
let cacheListenerInstalled = false;

function documentKey(type: string, id: string) {
  return `${type}:${id.replace(/^drafts\./, "")}`;
}

function installCacheListener() {
  if (cacheListenerInstalled || typeof window === "undefined") return;
  cacheListenerInstalled = true;
  window.addEventListener(changedEvent, (event) => {
    const change = (
      event as CustomEvent<{
        type?: string;
        id?: string;
        path?: string;
        value?: unknown;
        failed?: boolean;
        refreshLists?: boolean;
      }>
    ).detail;
    if (!change?.type || !change.id) {
      documentRequests.clear();
      return;
    }
    const key = documentKey(change.type, change.id);
    if (change.failed) {
      documentRequests.delete(key);
      return;
    }
    if (change.refreshLists) {
      documentRequests.clear();
      return;
    }
    if (change.path) {
      const path = change.path;
      const cached = documentRequests.get(key);
      if (cached) {
        documentRequests.set(
          key,
          cached.then((document) => {
            if (!document) return document;
            const next = structuredClone(document);
            const parts = path.split(".");
            let target = next;
            for (const part of parts.slice(0, -1)) {
              if (!target[part] || typeof target[part] !== "object")
                target[part] = {};
              target = target[part] as Record<string, unknown>;
            }
            const lastPart = parts[parts.length - 1];
            if (lastPart) target[lastPart] = change.value;
            return next;
          }),
        );
      }
    }
  });
}

function loadDocument(type: string, id: string) {
  const key = documentKey(type, id);
  const cached = documentRequests.get(key);
  if (cached) return cached;
  const request = requestJson<Record<string, unknown> | null>(
    makeUrl({ op: "document", type, id, view: "raw" }),
  ).catch((error: unknown) => {
    if (documentRequests.get(key) === request) documentRequests.delete(key);
    throw error;
  });
  documentRequests.set(key, request);
  return request;
}

function projectDocument(view: string, doc: Record<string, unknown>) {
  const category = doc._category as
    | { title?: string; departments?: string[]; slug?: string }
    | null
    | undefined;
  if (view === "productRow") {
    const slug = doc.slug as { current?: string } | undefined;
    const images = doc.images as unknown[] | undefined;
    return {
      ...doc,
      slug: slug?.current,
      category,
      image: doc.image ?? images?.[0] ?? null,
    };
  }
  if (view === "categoryChoice")
    return { title: doc.title, departments: doc.departments };
  if (view === "productChoice")
    return {
      name: doc.name,
      departments: category?.departments,
      categorySlug: category?.slug,
    };
  if (view === "recentOrder")
    return {
      orderNumber: doc.orderNumber,
      email: doc.email,
      total: doc.total,
      status: doc.status,
      createdAt: doc.createdAt,
    };
  if (view === "orderRow")
    return {
      orderNumber: doc.orderNumber,
      email: doc.email,
      customerPhone: doc.customerPhone,
      total: doc.total,
      status: doc.status,
      fulfillmentStatus: doc.fulfillmentStatus,
      createdAt: doc.createdAt,
      itemCount: Array.isArray(doc.items) ? doc.items.length : 0,
    };
  return doc;
}

export function createDocumentHandle(handle: DocumentHandle) {
  return handle;
}
export function createDocument(
  handle: DocumentHandle,
  value: Record<string, unknown> = {},
): Action {
  return {
    action: "create",
    type: handle.documentType,
    id: handle.documentId,
    value,
  };
}
export function publishDocument(handle: DocumentHandle): Action {
  return {
    action: "publish",
    type: handle.documentType,
    id: handle.documentId,
  };
}
export function discardDocument(handle: DocumentHandle): Action {
  return {
    action: "discard",
    type: handle.documentType,
    id: handle.documentId,
  };
}
export function deleteDocument(handle: DocumentHandle): Action {
  return { action: "delete", type: handle.documentType, id: handle.documentId };
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 413)
    throw new Error(
      "Image exceeds the 4 MB upload limit. Choose a smaller file.",
    );
  if (!response.ok)
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : "Admin content request failed",
    );
  return result as T;
}

function makeUrl(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") search.set(key, String(value));
  return `/api/admin/content?${search}`;
}

export function useDocuments(options: {
  documentType: string;
  filter?: string;
  orderings?: { field: string; direction: "asc" | "desc" }[];
  batchSize?: number;
}) {
  const [data, setData] = useState<DocumentHandle[] | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isPending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const requestRef = useRef(0);
  const order = options.orderings?.[0];
  const refresh = useCallback(
    async (append = false) => {
      const requestId = ++requestRef.current;
      setPending(true);
      try {
        const start = append ? offsetRef.current : 0;
        const result = await requestJson<{
          rows: (Record<string, unknown> & DocumentHandle)[];
          hasMore: boolean;
        }>(
          makeUrl({
            op: "list",
            type: options.documentType,
            filter: options.filter,
            limit: options.batchSize ?? 20,
            offset: start,
            order: order?.field,
            direction: order?.direction,
          }),
        );
        if (requestId !== requestRef.current) return;
        if (options.documentType !== "order") {
          for (const document of result.rows) {
            if (typeof document._id === "string")
              documentRequests.set(
                documentKey(options.documentType, document._id),
                Promise.resolve(document),
              );
          }
        }
        setData((previous) =>
          append ? [...(previous ?? []), ...result.rows] : result.rows,
        );
        offsetRef.current = start + result.rows.length;
        setHasMore(result.hasMore);
        setError(null);
      } catch (cause) {
        if (requestId === requestRef.current) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Admin content request failed",
          );
          setHasMore(false);
        }
      } finally {
        if (requestId === requestRef.current) setPending(false);
      }
    },
    [
      options.documentType,
      options.filter,
      options.batchSize,
      order?.field,
      order?.direction,
    ],
  );
  useEffect(() => {
    installCacheListener();
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const listener = (event: Event) => {
      const change = (event as CustomEvent<{ refreshLists?: boolean }>).detail;
      if (change && !change.refreshLists) return;
      void refresh();
    };
    window.addEventListener(changedEvent, listener);
    return () => window.removeEventListener(changedEvent, listener);
  }, [refresh]);
  return { data, hasMore, isPending, error, loadMore: () => refresh(true) };
}

export function useDocumentCount(options: {
  documentType: string;
  filter?: string;
}) {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    void requestJson<{ count: number }>(
      makeUrl({
        op: "count",
        type: options.documentType,
        filter: options.filter,
      }),
    )
      .then((result) => setCount(result.count))
      .catch(() => setCount(0));
  }, [options.documentType, options.filter]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ refreshLists?: boolean }>).detail;
      if (!detail || detail.refreshLists) refresh();
    };
    window.addEventListener(changedEvent, listener);
    return () => window.removeEventListener(changedEvent, listener);
  }, [refresh]);
  return { count };
}

function readPath(data: unknown, path?: string) {
  return path
    ? path
        .split(".")
        .reduce<unknown>(
          (value, key) =>
            value && typeof value === "object"
              ? (value as Record<string, unknown>)[key]
              : undefined,
          data,
        )
    : data;
}

export function useDocument<T = unknown>(
  handle: DocumentHandle & { path?: string },
) {
  const [document, setDocument] = useState<
    Record<string, unknown> | null | undefined
  >();
  const [error, setError] = useState<Error>();
  const requestRef = useRef(0);
  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const result = await loadDocument(handle.documentType, handle.documentId);
      if (requestId === requestRef.current) {
        setDocument(result);
        setError(undefined);
      }
    } catch (cause) {
      if (requestId === requestRef.current)
        setError(
          cause instanceof Error ? cause : new Error("Could not load document"),
        );
    }
  }, [handle.documentType, handle.documentId]);
  useEffect(() => {
    installCacheListener();
    void refresh();
  }, [refresh]);
  useEffect(() => {
    installCacheListener();
    const listener = (event: Event) => {
      const change = (
        event as CustomEvent<{
          type?: string;
          id?: string;
          path?: string;
          value?: unknown;
          failed?: boolean;
          refreshLists?: boolean;
        }>
      ).detail;
      if (
        change?.type === handle.documentType &&
        change.id?.replace(/^drafts\./, "") ===
          handle.documentId.replace(/^drafts\./, "")
      ) {
        if (change.path && !change.failed) {
          const path = change.path;
          setDocument((previous) => {
            if (!previous) return previous;
            const next = structuredClone(previous);
            const parts = path.split(".");
            let target = next;
            for (const part of parts.slice(0, -1)) {
              if (!target[part] || typeof target[part] !== "object")
                target[part] = {};
              target = target[part] as Record<string, unknown>;
            }
            const lastPart = parts[parts.length - 1];
            if (lastPart) target[lastPart] = change.value;
            return next;
          });
        }
      }
      if (
        change?.failed ||
        (change?.refreshLists &&
          change.type === handle.documentType &&
          change.id === handle.documentId)
      )
        void refresh();
    };
    window.addEventListener(changedEvent, listener);
    return () => window.removeEventListener(changedEvent, listener);
  }, [refresh, handle.documentType, handle.documentId]);
  const data = readPath(document, handle.path);
  const isPending = document === undefined && !error;
  return { data: data as T | null | undefined, isPending, error };
}

function projectionView(projection: string, type: string) {
  if (projection.includes("stripePaymentId")) return "orderDetail";
  if (projection.includes("itemCount")) return "orderRow";
  if (projection.includes("category->")) return "productRow";
  if (type === "product" && projection.includes('"image"')) return "productRow";
  if (type === "product" && projection.includes("departments"))
    return "productChoice";
  if (projection.includes("departments")) return "categoryChoice";
  if (projection.includes("createdAt")) return "recentOrder";
  return "raw";
}

export function useDocumentProjection<T = Record<string, unknown>>(
  options: DocumentHandle & { projection: string },
) {
  const view = projectionView(options.projection, options.documentType);
  const [data, setData] = useState<T | null | undefined>();
  const requestRef = useRef(0);
  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const document = await loadDocument(
        options.documentType,
        options.documentId,
      );
      if (requestId === requestRef.current)
        setData(
          document ? (projectDocument(view, document) as T) : (null as T),
        );
    } catch {
      if (requestId === requestRef.current) setData(null);
    }
  }, [options.documentType, options.documentId, view]);
  useEffect(() => {
    installCacheListener();
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          type?: string;
          id?: string;
          refreshLists?: boolean;
        }>
      ).detail;
      if (
        !detail ||
        (detail.type === options.documentType &&
          detail.id === options.documentId)
      )
        void refresh();
    };
    window.addEventListener(changedEvent, listener);
    return () => window.removeEventListener(changedEvent, listener);
  }, [refresh, options.documentType, options.documentId]);
  return { data, isPending: data === undefined };
}

export function useEditDocument(handle: DocumentHandle & { path: string }) {
  return useCallback(
    async (value: unknown): Promise<boolean> => {
      window.dispatchEvent(
        new CustomEvent(changedEvent, {
          detail: {
            type: handle.documentType,
            id: handle.documentId,
            path: handle.path,
            value,
          },
        }),
      );
      const key = `${handle.documentType}:${handle.documentId}:${handle.path}`;
      const previous = pendingWrites.get(key) ?? Promise.resolve();
      const next = previous
        .catch(() => undefined)
        .then(() =>
          requestJson("/api/admin/content", {
            method: "POST",
            body: JSON.stringify({
              action: "set",
              type: handle.documentType,
              id: handle.documentId,
              path: handle.path,
              value,
            }),
          }),
        );
      pendingWrites.set(key, next);
      try {
        await next;
        window.dispatchEvent(
          new CustomEvent(changedEvent, {
            detail: {
              type: handle.documentType,
              id: handle.documentId,
              path: handle.path,
              value,
            },
          }),
        );
        return true;
      } catch {
        window.dispatchEvent(
          new CustomEvent(changedEvent, {
            detail: {
              type: handle.documentType,
              id: handle.documentId,
              path: handle.path,
              failed: true,
            },
          }),
        );
        return false;
      }
    },
    [handle.documentType, handle.documentId, handle.path],
  );
}

export function useApplyDocumentActions(): (
  action: Action,
) => Promise<{ submitted: () => Promise<void> }> {
  return useCallback(
    async (action: Action): Promise<{ submitted: () => Promise<void> }> => {
      await requestJson("/api/admin/content", {
        method: "POST",
        body: JSON.stringify(action),
      });
      window.dispatchEvent(
        new CustomEvent(changedEvent, {
          detail: { ...action, refreshLists: true },
        }),
      );
      return { submitted: async () => undefined };
    },
    [],
  );
}

export function useQuery<T = unknown>(options: {
  query: string;
  params?: Record<string, string>;
  perspective?: string;
}) {
  const op = options.query.includes("references($id)")
    ? "references"
    : "exists";
  const [data, setData] = useState<T | null | undefined>();
  useEffect(() => {
    let active = true;
    void requestJson<T>(makeUrl({ op, id: options.params?.id }))
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setData(null);
      });
    return () => {
      active = false;
    };
  }, [op, options.params?.id]);
  return { data, isPending: data === undefined };
}

export function useClient(_options?: { apiVersion?: string }) {
  return {
    assets: {
      upload: async (
        _type: "image",
        file: File,
        _options?: { filename?: string },
      ) =>
        requestJson<{ _id: string }>("/api/admin/content", {
          method: "PUT",
          body: (() => {
            const form = new FormData();
            form.set("file", file);
            return form;
          })(),
        }),
    },
  };
}
