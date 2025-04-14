import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ref, get, set, remove } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { formatAuctions, formatUsersOrSellers, filterData } from "./admin";

export const useAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState({
    type: "",
    show: false,
    mode: "add",
    itemId: null,
  });
  const [newItem, setNewItem] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    activeAuctions: 0,
    pendingPayments: 0,
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication check
  useEffect(() => {
    const { state } = location;
    if (
      !state ||
      !state.isAuthenticated ||
      state.email !== "janardhanborse2003@gmail.com"
    ) {
      setError("You are not authorized to access this page.");
      navigate("/admin-login");
    }
  }, [location, navigate]);

  // Fetch data from Firebase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const usersRef = ref(database, "users");
      const usersSnapshot = await get(usersRef);
      const usersData = usersSnapshot.val() || {};
      const formattedUsers = formatUsersOrSellers(usersData);
      setUsers(formattedUsers);

      const sellersRef = ref(database, "sellers");
      const sellersSnapshot = await get(sellersRef);
      const sellersData = sellersSnapshot.val() || {};
      const formattedSellers = formatUsersOrSellers(sellersData);
      setSellers(formattedSellers);

      const auctionsRef = ref(database, "auctions");
      const auctionsSnapshot = await get(auctionsRef);
      const auctionsData = auctionsSnapshot.val() || {};
      const formattedAuctions = formatAuctions(auctionsData);
      setAuctions(formattedAuctions);

      setStats({
        totalUsers: formattedUsers.length,
        totalSellers: formattedSellers.length,
        activeAuctions: formattedAuctions.filter((a) => a.isActive).length,
        pendingPayments: formattedAuctions.filter(
          (a) => a.paymentStatus === "Pending"
        ).length,
      });

      setLoading(false);
    } catch (err) {
      setError("Failed to fetch data: " + err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update item in Firebase
  const handleUpdate = async (type, id, updates) => {
    try {
      const path =
        type === "users"
          ? `users/${id}`
          : type === "sellers"
          ? `sellers/${id}`
          : `auctions/${id}`;
      const itemRef = ref(database, path);

      let currentItem;
      if (type === "users") {
        currentItem = users.find((u) => u.id === id);
      } else if (type === "sellers") {
        currentItem = sellers.find((s) => s.id === id);
      } else {
        currentItem = auctions.find((a) => a.id === id);
        if (updates.endTime && typeof updates.endTime === "string") {
          updates.endTime = new Date(updates.endTime).getTime();
        }
      }

      await set(itemRef, { ...currentItem, ...updates });

      if (type === "users") {
        setUsers((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
      } else if (type === "sellers") {
        setSellers((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
      } else if (type === "auctions") {
        const updatedAuction = { ...currentItem, ...updates };
        if (updates.endTime) {
          updatedAuction.endTime = new Date(updates.endTime).toLocaleString();
        }
        if (updates.currentPrice) {
          updatedAuction.formattedPrice = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "INR",
          }).format(updates.currentPrice);
        }
        setAuctions((prev) =>
          prev.map((item) => (item.id === id ? updatedAuction : item))
        );
      }

      if (type === "auctions") {
        setStats((prev) => ({
          ...prev,
          activeAuctions: auctions.filter((a) =>
            a.id === id ? updates.isActive : a.isActive
          ).length,
          pendingPayments: auctions.filter((a) =>
            a.id === id
              ? updates.paymentStatus === "Pending"
              : a.paymentStatus === "Pending"
          ).length,
        }));
      }
    } catch (err) {
      setError("Failed to update: " + err.message);
    }
  };

  // Delete item from Firebase
  const handleDelete = async (type, id) => {
    if (window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      try {
        const path =
          type === "users"
            ? `users/${id}`
            : type === "sellers"
            ? `sellers/${id}`
            : `auctions/${id}`;
        const itemRef = ref(database, path);
        await remove(itemRef);

        if (type === "users") {
          setUsers((prev) => prev.filter((item) => item.id !== id));
          setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        } else if (type === "sellers") {
          const deletedSeller = sellers.find((s) => s.id === id);
          setSellers((prev) => prev.filter((item) => item.id !== id));
          setStats((prev) => ({ ...prev, totalSellers: prev.totalSellers - 1 }));

          const sellerAuctions = auctions.filter(
            (a) => a.seller === deletedSeller.email
          );
          sellerAuctions.forEach(async (auction) => {
            const auctionRef = ref(database, `auctions/${auction.id}`);
            await remove(auctionRef);
          });

          setAuctions((prev) =>
            prev.filter((auction) => auction.seller !== deletedSeller.email)
          );
          setStats((prev) => ({
            ...prev,
            activeAuctions:
              prev.activeAuctions -
              sellerAuctions.filter((a) => a.isActive).length,
            pendingPayments:
              prev.pendingPayments -
              sellerAuctions.filter((a) => a.paymentStatus === "Pending").length,
          }));
        } else if (type === "auctions") {
          const deletedAuction = auctions.find((a) => a.id === id);
          setAuctions((prev) => prev.filter((item) => item.id !== id));
          setStats((prev) => ({
            ...prev,
            activeAuctions: deletedAuction.isActive
              ? prev.activeAuctions - 1
              : prev.activeAuctions,
            pendingPayments:
              deletedAuction.paymentStatus === "Pending"
                ? prev.pendingPayments - 1
                : prev.pendingPayments,
          }));
        }
      } catch (err) {
        setError("Failed to delete: " + err.message);
      }
    }
  };

  // Prepare item for editing
  const handleEditItem = (type, id) => {
    let item;
    if (type === "users") {
      item = users.find((u) => u.id === id);
    } else if (type === "sellers") {
      item = sellers.find((s) => s.id === id);
    } else {
      item = auctions.find((a) => a.id === id);
      if (item.endTime) {
        const date = new Date(item.endTime);
        item = {
          ...item,
          endTimeForInput: new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16),
        };
      }
    }

    setNewItem(item);
    setShowModal({ type, show: true, mode: "edit", itemId: id });
  };

  // Initialize new item for adding
  const handleAdd = (type) => {
    setShowModal({ type, show: true, mode: "add", itemId: null });
    setNewItem(
      type === "users"
        ? { email: "", name: "" }
        : type === "sellers"
        ? { email: "", businessName: "" }
        : {
            productName: "",
            seller: "",
            currentPrice: "",
            endTime: "",
            paymentStatus: "Pending",
            isActive: false,
          }
    );
  };

  // Submit modal (add or edit)
  const handleModalSubmit = async () => {
    try {
      const { type, mode, itemId } = showModal;

      if (mode === "add") {
        const id = Date.now().toString();
        const path = `${type}/${id}`;
        const itemRef = ref(database, path);

        let newData;
        if (type === "auctions") {
          newData = {
            ...newItem,
            id,
            currentPrice: Number.parseFloat(newItem.currentPrice),
            endTime: new Date(newItem.endTime).getTime(),
            isActive: Boolean(newItem.isActive),
          };
        } else {
          newData = { ...newItem, id };
        }

        await set(itemRef, newData);

        if (type === "users") {
          setUsers((prev) => [...prev, newData]);
          setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
        } else if (type === "sellers") {
          setSellers((prev) => [...prev, newData]);
          setStats((prev) => ({ ...prev, totalSellers: prev.totalSellers + 1 }));
        } else if (type === "auctions") {
          const displayAuction = {
            ...newData,
            endTime: new Date(newData.endTime).toLocaleString(),
            formattedPrice: new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "INR",
            }).format(newData.currentPrice),
          };
          setAuctions((prev) => [...prev, displayAuction]);
          setStats((prev) => ({
            ...prev,
            activeAuctions: newData.isActive
              ? prev.activeAuctions + 1
              : prev.activeAuctions,
            pendingPayments:
              newData.paymentStatus === "Pending"
                ? prev.pendingPayments + 1
                : prev.pendingPayments,
          }));
        }
      } else if (mode === "edit") {
        if (type === "auctions" && newItem.endTimeForInput) {
          await handleUpdate(type, itemId, {
            ...newItem,
            endTime: new Date(newItem.endTimeForInput).getTime(),
            currentPrice: Number.parseFloat(newItem.currentPrice),
            isActive: Boolean(newItem.isActive),
          });
        } else {
          await handleUpdate(type, itemId, newItem);
        }
      }

      setShowModal({ type: "", show: false, mode: "add", itemId: null });
      setNewItem({});
    } catch (err) {
      setError("Failed to save: " + err.message);
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/admin-login");
    }
  };

  // Get filtered data
  const getFilteredData = (dataType) => {
    const data =
      dataType === "users" ? users : dataType === "sellers" ? sellers : auctions;
    return filterData(dataType, data, searchTerm);
  };

  return {
    users,
    sellers,
    auctions,
    error,
    loading,
    showModal,
    newItem,
    searchTerm,
    activeTab,
    stats,
    setSearchTerm,
    setActiveTab,
    fetchData,
    handleEditItem,
    handleDelete,
    handleAdd,
    handleModalSubmit,
    handleLogout,
    setNewItem,
    setShowModal,
    getFilteredData,
  };
};