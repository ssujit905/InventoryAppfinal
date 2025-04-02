import { RefreshControl, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { collection, getDocs, addDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase";
import dashboardStyles from "../styles/dashboardStyles";
import colors from "../styles/colors";
import { FontAwesome } from "@expo/vector-icons";
import moment from "moment";

const Dashboard = () => {
  const [searchText, setSearchText] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [returnedSales, setReturnedSales] = useState(0);
  const [monthlySales, setMonthlySales] = useState({});
  const [previousMonths, setPreviousMonths] = useState([]);
  const [showPreviousMonths, setShowPreviousMonths] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
const [isLoadingPreviousMonths, setIsLoadingPreviousMonths] = useState(false);





  const fetchSalesData = async () => {
    try {
      const salesRef = collection(db, "sales");
      const querySnapshot = await getDocs(salesRef);
      let salesList = [];
      const monthlyData = {};

      querySnapshot.forEach((doc) => {
        const saleData = doc.data();
        salesList.push({ id: doc.id, ...saleData });

        const saleDate = moment(saleData.date);
        const saleMonth = saleDate.format("MMM YYYY");

        if (!monthlyData[saleMonth]) {
          monthlyData[saleMonth] = { delivered: 0, returned: 0 };
        }

        if (saleData.status === "Delivered") monthlyData[saleMonth].delivered++;
        if (saleData.status === "Returned") monthlyData[saleMonth].returned++;
      });

      setSalesData(salesList);
      const currentMonth = moment().format("MMM YYYY");
      setMonthlySales({
        month: currentMonth,
        delivered: monthlyData[currentMonth]?.delivered || 0,
        returned: monthlyData[currentMonth]?.returned || 0,
      });

      setTotalSales(monthlyData[currentMonth]?.delivered || 0);
      setReturnedSales(monthlyData[currentMonth]?.returned || 0);

      const monthlySalesRef = collection(db, "monthly_sales");
      for (const [month, data] of Object.entries(monthlyData)) {
        const q = query(monthlySalesRef, where("month", "==", month));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          await addDoc(monthlySalesRef, {
            month,
            delivered: data.delivered,
            returned: data.returned,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  const fetchPreviousMonthsData = async () => {
    try {
      const q = query(collection(db, "monthly_sales"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const monthsList = querySnapshot.docs.map((doc) => doc.data());
      setPreviousMonths(monthsList);
    } catch (error) {
      console.error("Error fetching monthly sales:", error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchSalesData();
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredSales([]);
    } else {
      const filtered = salesData.filter((sale) => {
        return (
          (sale.customerName &&
            sale.customerName.toLowerCase().includes(searchText.toLowerCase())) ||
          (sale.phone1 && sale.phone1.includes(searchText)) ||
          (sale.phone2 && sale.phone2.includes(searchText))
        );
      });
      setFilteredSales(filtered);
    }
  }, [searchText, salesData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSalesData();
    setIsRefreshing(false);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    setSearchText("");
    setFilteredSales([]);
  };

  if (isLoading) {
    return (
      <View style={dashboardStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={dashboardStyles.container}
contentContainerStyle={dashboardStyles.contentContainer}


      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <Text style={dashboardStyles.title}>InventoryApp</Text>

      <View style={dashboardStyles.searchContainer}>
        <TouchableOpacity onPress={toggleSearch}>
          <FontAwesome name="search" size={20} color={colors.primary} />
        </TouchableOpacity>
        {isSearchVisible && (
          <TextInput
            style={dashboardStyles.searchInput}
            placeholder="Enter Name or Phone Number"
            value={searchText}
            onChangeText={setSearchText}
          />
        )}
      </View>

      {filteredSales.length > 0 && (
        <View>
          {filteredSales.map((item) => (
            <View key={item.id} style={dashboardStyles.salesCard}>
              {item.image && (
                <Image source={{ uri: item.image }} style={dashboardStyles.salesImage} />
              )}
              <Text>Date: {item.date}</Text>
              <Text>Name: {item.customerName}</Text>
              <Text>Phone: {item.phone1}</Text>
              <Text>Status: {item.status}</Text>

<Text>Product Code: {item.products?.map((p) => p.productCode).join(", ")}</Text>

              <Text>Quantity: {item.products?.map((p) => p.quantity).join(", ")}</Text>


<Text>CodAmount: {item.codAmount}</Text>



            </View>
          ))}
        </View>
      )}

      <View style={dashboardStyles.quoteCard}>
        <Text style={dashboardStyles.quoteText}>
          “The biggest risk is not taking any risk. In a world that’s changing quickly, the only
          strategy that is guaranteed to fail is not taking risks.”
        </Text>
        <Text style={dashboardStyles.signature}>Sujit Singh Creation</Text>
      </View>

      <Text style={dashboardStyles.sectionTitle}>Total Sales</Text>
      <Text style={dashboardStyles.salesCount}>{totalSales}</Text>

      <Text style={dashboardStyles.sectionTitle}>Returned Sales</Text>
      <Text style={dashboardStyles.returnedCount}>{returnedSales}</Text>

      <Text style={dashboardStyles.sectionTitle}>Monthly Sales</Text>
      <Text style={dashboardStyles.monthText}>{monthlySales.month}</Text>
      <Text style={dashboardStyles.deliveredText}>Delivered: {monthlySales.delivered}</Text>
      <Text style={dashboardStyles.returnedText}>Returned: {monthlySales.returned}</Text>

<TouchableOpacity
        style={[dashboardStyles.button, { backgroundColor: colors.primary }]}
        onPress={async () => {
          if (!showPreviousMonths) {
            setIsLoadingPreviousMonths(true);
            await fetchPreviousMonthsData();
            setIsLoadingPreviousMonths(false);
          }
          setShowPreviousMonths(!showPreviousMonths);
        }}
        disabled={isLoadingPreviousMonths}
      >
<Text style={dashboardStyles.buttonText}>
          {isLoadingPreviousMonths
            ? "Loading..."
            : showPreviousMonths
            ? "Hide All Months"
            : "Show All Months"}
        </Text>
      </TouchableOpacity>







      {showPreviousMonths &&
        previousMonths.map((monthData, index) => (
          <View key={index} style={dashboardStyles.monthCard}>
            <Text style={dashboardStyles.monthHeader}>{monthData.month}</Text>
            <Text>Delivered: {monthData.delivered}</Text>
            <Text>Returned: {monthData.returned}</Text>
          </View>
        ))}
    </ScrollView>
  );
};

export default Dashboard;
