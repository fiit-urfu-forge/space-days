import { createHashRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "components/layouts/main-layout";

import { HomePage } from "./main/home";
import { EventsPage } from "./main/events";
import { AdminEventsPage } from "./admin/events";
import { RegistrationPage } from "./main/registration";
import { TicketsPage } from "./main/tickets";
import { NotFound } from "components/not-found";
import { AllTicketsPage } from "./all-tickets";
import { AdminLayout } from "components/layouts/admin-layout";
import { LogInPage } from "./admin/login";
import { LogInSuppPage } from "./admin/login/support";
import { AdminUsersPage } from "./admin/users";
import { ExportPage } from "./admin/export";
import { eventsLoader } from "./admin/events";

const routesConfig = [
  { path: "*", element: <NotFound /> },
  {
    path: "/all-tickets",
    element: <AllTicketsPage />,
  },
  {
    path: "/admin/",
    element: <LogInPage />,
  },
  {
    path: "/token/*",
    element: <LogInSuppPage />,
  },
  {
    element: <AdminLayout />,
    children: [
      {
        path: "/admin/events",
        element: <AdminEventsPage />,
        loader: eventsLoader,
      },
      {
        path: "/admin/users",
        element: <AdminUsersPage />,
      },
      {
        path: "/admin/export",
        element: <ExportPage />,
      },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/events",
        element: <EventsPage />,
      },
      {
        path: "/registration",
        element: <RegistrationPage />,
      },
      {
        path: "/tickets",
        element: <TicketsPage />,
      },
    ],
  },
];

const router = createHashRouter(routesConfig);

export const Routing = () => {
  return <RouterProvider router={router} />;
};
