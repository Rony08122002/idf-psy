import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import DailyAssessment from "./pages/DailyAssessment";
import UserStats from "./pages/UserStats";
import "./index.css";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/chat-fixes.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/assessment" element={<DailyAssessment />} />
        <Route path="/stats" element={<UserStats />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);