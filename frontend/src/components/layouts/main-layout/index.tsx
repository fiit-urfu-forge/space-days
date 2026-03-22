import { Header } from "./header";
import { Outlet } from "react-router-dom";
import { Footer } from "./footer";
import Container from "react-bootstrap/Container";

export const MainLayout = () => {
  return (
    <Container>
      <Header />
      <Outlet />
      <Footer />
    </Container>
  );
};
