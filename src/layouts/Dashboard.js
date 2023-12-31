import React, { useState } from "react";
import styled from "@emotion/styled";
import { Outlet } from "react-router-dom";

import { Box, CssBaseline, Paper as MuiPaper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { spacing } from "@mui/system";

import GlobalStyle from "../components/GlobalStyle";
import Navbar from "../components/navbar/Navbar";
import dashboardItems from "../components/sidebar/dashboardItems";
import Sidebar from "../components/sidebar/Sidebar";
import Footer from "../components/Footer";
import { useQuery } from "@tanstack/react-query";
import { getUserPermissions } from "../api/user";
import useAuth from "../hooks/useAuth";
// import Settings from "../components/Settings";

const drawerWidth = 258;

const Root = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Drawer = styled.div`
  ${(props) => props.theme.breakpoints.up("md")} {
    width: ${drawerWidth}px;
    flex-shrink: 0;
  }
`;

const AppContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 100%;
`;

const Paper = styled(MuiPaper)(spacing);

const MainContent = styled(Paper)`
  flex: 1;
  background: ${(props) => props.theme.palette.background.default};

  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    flex: none;
  }

  .MuiPaper-root .MuiPaper-root {
    box-shadow: none;
  }
`;

const Dashboard = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const { isLoading, isError, data } = useQuery(["getUserPermissions"], getUserPermissions);

  if (isLoading) {
    return "...loading";
  }

  if (isError) {
    return "...error";
  }
  // Function to check if the user has permission to access a route
  const hasPermission = (route) => {
    const userPermissions = data.data;
    const permissions = userPermissions.filter((obj) => obj === route);
    if (permissions && permissions.length > 0) {
      // Check if the user has at least one of the required permissions
      return true; // You can modify this logic as needed based on your use case
    }
    // If user's permissions are not specified, deny access by default
    return false;
  };

  // Recursive function to filter pages and their children based on user permissions
  const filterPagesWithPermission = (pages) => {
    return pages.reduce((filteredPages, page) => {
      if (hasPermission(page.href)) {
        const filteredChildren = page.children ? filterPagesWithPermission(page.children) : null;
        const filteredPage = filteredChildren ? { ...page, children: filteredChildren } : page;
        filteredPages.push(filteredPage);
      }
      return filteredPages;
    }, []);
  };

  // Filter the dashboardItems based on user's permissions
  const filteredDashboardItems = dashboardItems.map((item) => {
    const pagesWithPermission = filterPagesWithPermission(item.pages);
    return { ...item, pages: pagesWithPermission };
  });

  return (
    <Root>
      <CssBaseline />
      <GlobalStyle />
      <Drawer>
        <Box sx={{ display: { xs: "block", lg: "none" } }}>
          <Sidebar
            PaperProps={{ style: { width: drawerWidth } }}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            items={
              user && user.authorities.length > 0 && user.authorities[0].authority === "ADMIN"
                ? dashboardItems
                : filteredDashboardItems
            }
          />
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Sidebar
            PaperProps={{ style: { width: drawerWidth } }}
            items={
              user && user.authorities.length > 0 && user.authorities[0].authority === "ADMIN"
                ? dashboardItems
                : filteredDashboardItems
            }
          />
        </Box>
      </Drawer>
      <AppContent>
        <Navbar onDrawerToggle={handleDrawerToggle} />
        <MainContent p={isLgUp ? 12 : 5}>
          {children}
          <Outlet />
        </MainContent>
        <Footer />
      </AppContent>
      {/* <Settings /> */}
    </Root>
  );
};

export default Dashboard;
