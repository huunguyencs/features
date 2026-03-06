import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import UrlShortener from "./tools/UrlShortener";
import JwtDecoder from "./tools/JwtDecoder";
import TokenGenerator from "./tools/TokenGenerator";
import Base64Tool from "./tools/Base64Tool";
import JsonFormatter from "./tools/JsonFormatter";
import HashGenerator from "./tools/HashGenerator";
import QrGenerator from "./tools/QrGenerator";
import RegexTester from "./tools/RegexTester";
import RedirectHandler from "./tools/RedirectHandler";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/r/:shortId" element={<RedirectHandler />} />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/url-shortener" replace />} />
          <Route path="/url-shortener" element={<UrlShortener />} />
          <Route path="/jwt-decoder" element={<JwtDecoder />} />
          <Route path="/token-generator" element={<TokenGenerator />} />
          <Route path="/base64" element={<Base64Tool />} />
          <Route path="/json-formatter" element={<JsonFormatter />} />
          <Route path="/hash-generator" element={<HashGenerator />} />
          <Route path="/qr-generator" element={<QrGenerator />} />
          <Route path="/regex-tester" element={<RegexTester />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
