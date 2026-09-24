"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, getOrders } from "@/lib/api";
import { clearSession, getLanguage, getMerchant } from "@/lib/auth";
import { ORDER_STATUSES, type Order } from "@/lib/types";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 20;

type OrderFilters = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
};

const EMPTY_FILTERS: OrderFilters = {
  id: "",
  name: "",
  phone: "",
  email: "",
  status: "",
};

function customerName(order: Order) {
  const first = order.billing?.firstName ?? "";
  const last = order.billing?.lastName ?? "";
  return `${first} ${last}`.trim() || "—";
}

export function OrdersTable() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [applied, setApplied] = useState<OrderFilters>(EMPTY_FILTERS);

  const load = useCallback(
    async (nextPage: number, filters: OrderFilters) => {
      setLoading(true);
      setError("");
      try {
        const data = await getOrders({
          store: getMerchant(),
          lang: getLanguage(),
          count: PAGE_SIZE,
          page: nextPage,
          ...filters,
        });
        setOrders(data.orders ?? []);
        setTotal(data.recordsTotal ?? data.orders?.length ?? 0);
        setPage(nextPage);
        setApplied(filters);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearSession();
          router.replace("/login");
          return;
        }
        setOrders([]);
        setTotal(0);
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load orders from the Shopizer API.",
        );
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void load(1, EMPTY_FILTERS);
  }, [load]);

  function onFilter(event: FormEvent) {
    event.preventDefault();
    void load(1, { id, name, phone, email, status });
  }

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);

  return (
    <section className="panel">
      <h1 className="page-title">Orders</h1>
      <p className="notice">
        Next route <code>/orders</code> mirrors Angular{" "}
        <code>#/pages/orders/order-list</code>. Order details are not in this
        slice.
      </p>

      <form className="filters" onSubmit={onFilter}>
        <input
          placeholder="Order id"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <input
          placeholder="Customer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button className="btn" type="submit">
          Filter
        </button>
      </form>

      {loading ? <p className="center">Loading orders…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && orders.length === 0 ? (
        <p className="empty">No orders returned for this store and filter.</p>
      ) : null}

      {!loading && orders.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{customerName(order)}</td>
                  <td>{order.billing?.phone ?? "—"}</td>
                  <td>{order.billing?.email ?? "—"}</td>
                  <td>{order.total?.value ?? "—"}</td>
                  <td>{order.datePurchased ?? "—"}</td>
                  <td>
                    <span className="status">{order.orderStatus ?? "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="pager">
        <span className="muted">
          {total} order{total === 1 ? "" : "s"} · page {page} of {lastPage}
        </span>
        <div>
          <button
            className="btn"
            type="button"
            disabled={loading || page <= 1}
            onClick={() => void load(page - 1, applied)}
          >
            Previous
          </button>{" "}
          <button
            className="btn"
            type="button"
            disabled={loading || page >= lastPage}
            onClick={() => void load(page + 1, applied)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
