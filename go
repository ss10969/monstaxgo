import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Package2,
  Store,
  CreditCard,
  Lock,
  LogOut,
  ShieldCheck,
  Search,
} from "lucide-react";

const product = {
  id: 1,
  brand: "SEVENTEEN",
  name: "專輯代購頁",
  image:
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
  description:
    "同一個商品頁內可直接選版本與通路，系統會自動帶出對應價格，再選擇數量加入購物車。",
  versions: ["Digipack Ver. 個人封", "Heartbreak", "Thirst", "Alive", "Heal"],
  pricing: {
    "Digipack Ver. 個人封": {
      "Barnes & Noble": 810,
      "POP-UP": 950,
      Target: 810,
      Walmart: 810,
      hello82: 810,
    },
    Heartbreak: {
      "Barnes & Noble": 1200,
      "POP-UP": 1400,
      Target: 1230,
      Walmart: 1230,
      hello82: 1400,
      簽專: 1450,
    },
    Thirst: {
      "Barnes & Noble": 1200,
      "POP-UP": 1400,
      Target: 1230,
      Walmart: 1230,
      hello82: 1400,
      簽專: 1450,
    },
    Alive: {
      "Barnes & Noble": 1200,
      "POP-UP": 1400,
      Target: 1230,
      Walmart: 1230,
      hello82: 1400,
      簽專: 1450,
    },
    Heal: {
      "Barnes & Noble": 1200,
      "POP-UP": 1400,
      Target: 1230,
      Walmart: 1230,
      hello82: 1400,
      簽專: 1450,
    },
  },
};

const hiddenAdminPath = "#/manage-8xk2q9-orders";
const demoAdminEmail = "admin@store.local";
const demoAdminPassword = "angie-admin-demo";

const sampleOrders = [
  {
    id: "GO-20260407-001",
    createdAt: "2026-04-07 19:45",
    socialName: "Angie GO",
    email: "demo1@email.com",
    socialAccount: "@angiego",
    transferTime: "4/7 19:30",
    status: "待確認",
    paymentStatus: "已填匯款",
    shippingStatus: "未出貨",
    total: 298,
    items: [
      {
        name: "單色腮紅代購頁",
        version: "文字腮紅",
        channel: "Barnes & Noble",
        quantity: 2,
        price: 149,
      },
    ],
  },
  {
    id: "GO-20260407-002",
    createdAt: "2026-04-07 20:10",
    socialName: "Mango Group",
    email: "demo2@email.com",
    socialAccount: "line:mangogo",
    transferTime: "4/7 20:01",
    status: "已確認",
    paymentStatus: "已對帳",
    shippingStatus: "備貨中",
    total: 447,
    items: [
      {
        name: "單色腮紅代購頁",
        version: "小熊聯名腮紅",
        channel: "POP-UP",
        quantity: 3,
        price: 149,
      },
    ],
  },
];

const statusClasses = {
  待確認: "bg-amber-100 text-amber-700",
  已確認: "bg-emerald-100 text-emerald-700",
  已完成: "bg-sky-100 text-sky-700",
  已填匯款: "bg-violet-100 text-violet-700",
  已對帳: "bg-emerald-100 text-emerald-700",
  未出貨: "bg-rose-100 text-rose-700",
  備貨中: "bg-orange-100 text-orange-700",
  已出貨: "bg-sky-100 text-sky-700",
};

export default function GroupOrderStore() {
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("product");
  const [checkout, setCheckout] = useState({
    socialName: "",
    email: "",
    socialAccount: "",
    transferTime: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrders, setSubmittedOrders] = useState(sampleOrders);
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [adminLogin, setAdminLogin] = useState({ email: "", password: "" });
  const [adminError, setAdminError] = useState("");
  const [adminSearch, setAdminSearch] = useState("");

  useEffect(() => {
    const syncRoute = () => {
      if (window.location.hash === "#/cart") {
        setPage("cart");
        return;
      }

      if (window.location.hash === hiddenAdminPath) {
        setPage("admin");
        return;
      }

      setPage("product");
    };

    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const availableChannels = useMemo(() => {
    if (!selectedVersion) return [];
    return Object.keys(product.pricing[selectedVersion] || {});
  }, [selectedVersion]);

  const selectedPrice = useMemo(() => {
    if (!selectedVersion || !selectedChannel) return 0;
    return product.pricing[selectedVersion]?.[selectedChannel] || 0;
  }, [selectedVersion, selectedChannel]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const filteredOrders = useMemo(() => {
    const keyword = adminSearch.trim().toLowerCase();
    if (!keyword) return submittedOrders;

    return submittedOrders.filter((order) => {
      const combined = [
        order.id,
        order.socialName,
        order.email,
        order.socialAccount,
        order.transferTime,
        order.status,
        order.paymentStatus,
        order.shippingStatus,
        ...order.items.map((item) => `${item.name} ${item.version} ${item.channel}`),
      ]
        .join(" ")
        .toLowerCase();

      return combined.includes(keyword);
    });
  }, [submittedOrders, adminSearch]);

  const adminStats = useMemo(() => {
    return {
      totalOrders: submittedOrders.length,
      totalAmount: submittedOrders.reduce((sum, order) => sum + order.total, 0),
      pendingCount: submittedOrders.filter((order) => order.status === "待確認").length,
      shippedCount: submittedOrders.filter((order) => order.shippingStatus === "已出貨").length,
    };
  }, [submittedOrders]);

  const addToCart = () => {
    if (!selectedVersion || !selectedChannel || quantity < 1) return;

    const cartKey = `${selectedVersion}-${selectedChannel}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...prev,
        {
          cartKey,
          productId: product.id,
          name: product.name,
          version: selectedVersion,
          channel: selectedChannel,
          quantity,
          price: selectedPrice,
        },
      ];
    });

    setQuantity(1);
    window.location.hash = "#/cart";
  };

  const updateCartQuantity = (cartKey, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item))
    );
  };

  const removeCartItem = (cartKey) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const updateCheckout = (key, value) => {
    setCheckout((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    cart.length > 0 &&
    checkout.socialName.trim() &&
    checkout.email.trim() &&
    checkout.socialAccount.trim() &&
    checkout.transferTime.trim();

  const submitOrder = () => {
    if (!canSubmit) return;

    const newOrder = {
      id: `GO-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      socialName: checkout.socialName,
      email: checkout.email,
      socialAccount: checkout.socialAccount,
      transferTime: checkout.transferTime,
      status: "待確認",
      paymentStatus: "已填匯款",
      shippingStatus: "未出貨",
      total: cartSubtotal,
      items: cart.map((item) => ({
        name: item.name,
        version: item.version,
        channel: item.channel,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    setSubmittedOrders((prev) => [newOrder, ...prev]);
    setSubmitted(true);
    setCart([]);
    setCheckout({
      socialName: "",
      email: "",
      socialAccount: "",
      transferTime: "",
    });
  };

  const loginAdmin = () => {
    if (adminLogin.email === demoAdminEmail && adminLogin.password === demoAdminPassword) {
      setAdminAuthorized(true);
      setAdminError("");
      return;
    }

    setAdminError("帳號或密碼錯誤");
  };

  const logoutAdmin = () => {
    setAdminAuthorized(false);
    setAdminLogin({ email: "", password: "" });
    setAdminError("");
    window.location.hash = "#/";
  };

  const updateOrderField = (id, field, value) => {
    setSubmittedOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, [field]: value } : order))
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {page !== "admin" && (
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge className="rounded-full bg-rose-500 px-3 py-1 text-white">代購商店</Badge>
                <Badge variant="outline" className="rounded-full">免註冊下單</Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">專輯 / 美妝代購網站原型</h1>
              <p className="mt-2 text-sm text-neutral-500">
                商品頁可以選版本、通路、數量並加入購物車，購物車頁可查看總金額並填寫完整訂單資料。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={page === "product" ? "default" : "outline"}
                className="rounded-2xl"
                onClick={() => {
                  setPage("product");
                  window.location.hash = "#/";
                }}
              >
                <Store className="mr-2 h-4 w-4" /> 商品頁
              </Button>
              <Button
                variant={page === "cart" ? "default" : "outline"}
                className="rounded-2xl"
                onClick={() => {
                  setPage("cart");
                  window.location.hash = "#/cart";
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" /> 購物車 ({cartCount})
              </Button>
            </div>
          </div>

          {page === "product" && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
                <div className="aspect-square w-full bg-neutral-100">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </div>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardContent className="space-y-6 p-6 md:p-8">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Badge className="rounded-full bg-rose-100 text-rose-600">商城</Badge>
                      <span className="text-sm text-neutral-400">{product.brand}</span>
                    </div>
                    <h2 className="text-3xl font-bold leading-tight">{product.name}</h2>
                    <p className="mt-3 text-sm leading-6 text-neutral-500">{product.description}</p>
                  </div>

                  <div className="rounded-3xl bg-neutral-50 p-5">
                    <div className="text-sm text-neutral-500">目前價格</div>
                    <div className="mt-2 text-5xl font-bold text-rose-600">
                      {selectedPrice ? `NT$${selectedPrice}` : "請先選版本與通路"}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">版本</Label>
                      <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                        <SelectTrigger className="h-12 rounded-2xl">
                          <SelectValue placeholder="請選擇版本" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.versions.map((version) => (
                            <SelectItem key={version} value={version}>
                              {version}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">通路</Label>
                      <Select value={selectedChannel} onValueChange={setSelectedChannel} disabled={!selectedVersion}>
                        <SelectTrigger className="h-12 rounded-2xl">
                          <SelectValue placeholder={selectedVersion ? "請選擇通路" : "請先選擇版本"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableChannels.map((channel) => (
                            <SelectItem key={channel} value={channel}>
                              {channel} ・ NT${product.pricing[selectedVersion]?.[channel]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">數量</Label>
                      <div className="flex w-fit items-center gap-3 rounded-2xl border bg-white p-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[60px] text-center text-lg font-semibold">{quantity}</div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          onClick={() => setQuantity((prev) => prev + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-white p-5">
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>目前選擇</span>
                      <span>{cartCount} 件在購物車</span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="text-sm">版本：{selectedVersion || "尚未選擇"}</div>
                      <div className="text-sm">通路：{selectedChannel || "尚未選擇"}</div>
                      <div className="text-sm">數量：{quantity}</div>
                    </div>
                    <div className="mt-4 text-xl font-bold">小計：NT${selectedPrice * quantity}</div>
                  </div>

                  <Button className="h-12 w-full rounded-2xl text-base" onClick={addToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> 加入購物車
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {page === "cart" && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Package2 className="h-6 w-6" /> 購物車內容
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cart.length === 0 ? (
                      <div className="rounded-2xl border border-dashed p-10 text-center text-neutral-500">
                        目前購物車是空的，先回商品頁選擇版本與通路吧。
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.cartKey} className="rounded-2xl border bg-white p-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <div className="text-lg font-semibold">{item.name}</div>
                              <div className="text-sm text-neutral-500">版本：{item.version}</div>
                              <div className="text-sm text-neutral-500">通路：{item.channel}</div>
                              <div className="text-sm text-neutral-500">單價：NT${item.price}</div>
                            </div>

                            <div className="flex flex-col items-start gap-3 md:items-end">
                              <div className="flex items-center gap-2 rounded-2xl border p-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="rounded-xl"
                                  onClick={() => updateCartQuantity(item.cartKey, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <div className="min-w-[56px] text-center font-semibold">{item.quantity}</div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="rounded-xl"
                                  onClick={() => updateCartQuantity(item.cartKey, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-lg font-bold">NT${item.price * item.quantity}</div>
                              <Button
                                variant="ghost"
                                className="rounded-2xl text-rose-600"
                                onClick={() => removeCartItem(item.cartKey)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> 刪除
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <CreditCard className="h-6 w-6" /> 訂單資料
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <div className="flex items-center justify-between text-sm text-neutral-500">
                        <span>商品件數</span>
                        <span>{cartCount}</span>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>總金額</span>
                        <span>NT${cartSubtotal}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>社群名稱</Label>
                      <Input
                        placeholder="例如：Angie GO"
                        value={checkout.socialName}
                        onChange={(e) => updateCheckout("socialName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={checkout.email}
                        onChange={(e) => updateCheckout("email", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>社群軟體帳號</Label>
                      <Input
                        placeholder="例如：IG / X / LINE 帳號"
                        value={checkout.socialAccount}
                        onChange={(e) => updateCheckout("socialAccount", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>匯款時間</Label>
                      <Input
                        placeholder="例如：4/7 19:30"
                        value={checkout.transferTime}
                        onChange={(e) => updateCheckout("transferTime", e.target.value)}
                      />
                    </div>

                    <Button className="h-12 w-full rounded-2xl text-base" disabled={!canSubmit} onClick={submitOrder}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> 送出訂單
                    </Button>

                    {!canSubmit && (
                      <p className="text-sm text-neutral-500">
                        需填完社群名稱、email、社群軟體帳號、匯款時間，且購物車內要有商品，才能送出。
                      </p>
                    )}

                    {submitted && (
                      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                        已成功送出訂單。之後可以再接資料庫或表單 API，真正儲存訂單。
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {page === "admin" && (
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          {!adminAuthorized ? (
            <div className="mx-auto max-w-md">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Lock className="h-6 w-6" /> Admin Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
                    這個頁面沒有任何前台入口，只有直接進入隱藏路徑的人才看得到。
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={adminLogin.email}
                      onChange={(e) => setAdminLogin((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="admin email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={adminLogin.password}
                      onChange={(e) => setAdminLogin((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="password"
                    />
                  </div>

                  {adminError && <p className="text-sm text-rose-600">{adminError}</p>}

                  <Button className="w-full rounded-2xl" onClick={loginAdmin}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> 登入後台
                  </Button>

                  <div className="rounded-2xl border border-dashed p-4 text-xs leading-6 text-neutral-500">
                    Demo hidden path：{hiddenAdminPath}
                    <br />
                    Demo login：{demoAdminEmail}
                    <br />
                    Demo password：{demoAdminPassword}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge className="rounded-full bg-slate-900 text-white">Admin</Badge>
                    <Badge variant="outline" className="rounded-full">隱藏後台</Badge>
                  </div>
                  <h2 className="text-3xl font-bold">訂單管理後台</h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    這裡只存在於隱藏路徑，前台沒有任何按鈕、導覽或提示會帶顧客進來。
                  </p>
                </div>
                <Button variant="outline" className="rounded-2xl" onClick={logoutAdmin}>
                  <LogOut className="mr-2 h-4 w-4" /> 登出
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="總訂單數" value={adminStats.totalOrders} />
                <StatCard title="總金額" value={`NT$${adminStats.totalAmount}`} />
                <StatCard title="待確認" value={adminStats.pendingCount} />
                <StatCard title="已出貨" value={adminStats.shippedCount} />
              </div>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardContent className="p-4 md:p-5">
                  <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      className="pl-9"
                      placeholder="搜尋訂單編號、社群名稱、通路、email"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="rounded-3xl border-0 shadow-sm">
                    <CardContent className="space-y-5 p-5 md:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold">{order.id}</h3>
                            <Badge className={`rounded-full ${statusClasses[order.status] || "bg-neutral-100 text-neutral-700"}`}>
                              {order.status}
                            </Badge>
                            <Badge className={`rounded-full ${statusClasses[order.paymentStatus] || "bg-neutral-100 text-neutral-700"}`}>
                              {order.paymentStatus}
                            </Badge>
                            <Badge className={`rounded-full ${statusClasses[order.shippingStatus] || "bg-neutral-100 text-neutral-700"}`}>
                              {order.shippingStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-500">建立時間：{order.createdAt}</p>
                          <p className="text-sm text-neutral-500">社群名稱：{order.socialName}</p>
                          <p className="text-sm text-neutral-500">Email：{order.email}</p>
                          <p className="text-sm text-neutral-500">社群帳號：{order.socialAccount}</p>
                          <p className="text-sm text-neutral-500">匯款時間：{order.transferTime}</p>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-neutral-500">訂單總額</div>
                          <div className="text-3xl font-bold">NT${order.total}</div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={`${order.id}-${index}`} className="rounded-2xl bg-neutral-50 p-4">
                              <div className="font-semibold">{item.name}</div>
                              <div className="mt-1 text-sm text-neutral-500">版本：{item.version}</div>
                              <div className="text-sm text-neutral-500">通路：{item.channel}</div>
                              <div className="text-sm text-neutral-500">數量：{item.quantity}</div>
                              <div className="mt-1 text-sm text-neutral-500">單價：NT${item.price}</div>
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-3 md:min-w-[240px]">
                          <div className="space-y-2">
                            <Label>訂單狀態</Label>
                            <Select value={order.status} onValueChange={(value) => updateOrderField(order.id, "status", value)}>
                              <SelectTrigger className="rounded-2xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="待確認">待確認</SelectItem>
                                <SelectItem value="已確認">已確認</SelectItem>
                                <SelectItem value="已完成">已完成</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>付款狀態</Label>
                            <Select
                              value={order.paymentStatus}
                              onValueChange={(value) => updateOrderField(order.id, "paymentStatus", value)}
                            >
                              <SelectTrigger className="rounded-2xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="已填匯款">已填匯款</SelectItem>
                                <SelectItem value="已對帳">已對帳</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>出貨狀態</Label>
                            <Select
                              value={order.shippingStatus}
                              onValueChange={(value) => updateOrderField(order.id, "shippingStatus", value)}
                            >
                              <SelectTrigger className="rounded-2xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="未出貨">未出貨</SelectItem>
                                <SelectItem value="備貨中">備貨中</SelectItem>
                                <SelectItem value="已出貨">已出貨</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="text-sm text-neutral-500">{title}</div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
