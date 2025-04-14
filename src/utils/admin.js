// Format auction data for display
export const formatAuctions = (auctionsData) => {
    return Object.entries(auctionsData).map(([id, data]) => ({
      id,
      ...data,
      endTime: new Date(data.endTime).toLocaleString(),
      formattedPrice: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(data.currentPrice),
    }));
  };
  
  // Format users or sellers data
  export const formatUsersOrSellers = (data) => {
    return Object.entries(data).map(([id, data]) => ({ id, ...data }));
  };
  
  // Filter data based on search term
  export const filterData = (dataType, data, searchTerm) => {
    if (!searchTerm) return data;
  
    const term = searchTerm.toLowerCase();
  
    if (dataType === "users") {
      return data.filter(
        (user) =>
          user.email?.toLowerCase().includes(term) ||
          user.name?.toLowerCase().includes(term)
      );
    } else if (dataType === "sellers") {
      return data.filter(
        (seller) =>
          seller.email?.toLowerCase().includes(term) ||
          seller.businessName?.toLowerCase().includes(term)
      );
    } else {
      return data.filter(
        (auction) =>
          auction.productName?.toLowerCase().includes(term) ||
          auction.seller?.toLowerCase().includes(term) ||
          auction.paymentStatus?.toLowerCase().includes(term)
      );
    }
  };