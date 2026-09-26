import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { InstrumentProvider } from "@/context/InstrumentContext";

import Home from "@/pages/Home";
import Fundamentals from "@/pages/Fundamentals";
import LensRayTracing from "@/pages/LensRayTracing";
import BeamPropagation from "@/pages/BeamPropagation";
import FiberOptic from "@/pages/FiberOptic";
import Microscope from "@/pages/Microscope";
import Raman from "@/pages/Raman";
import OCT from "@/pages/OCT";
import ImageProcessing from "@/pages/ImageProcessing";
import SIM from "@/pages/SIM";
import SystemBuilder from "@/pages/SystemBuilder";
import ResultsDashboard from "@/pages/ResultsDashboard";
import ReportGenerator from "@/pages/ReportGenerator";

function App() {
  return (
    <div className="App">
      <InstrumentProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/modules/fundamentals" element={<Fundamentals />} />
              <Route path="/modules/lens-ray-tracing" element={<LensRayTracing />} />
              <Route path="/modules/beam-propagation" element={<BeamPropagation />} />
              <Route path="/modules/fiber-optic" element={<FiberOptic />} />
              <Route path="/modules/microscope" element={<Microscope />} />
              <Route path="/modules/raman" element={<Raman />} />
              <Route path="/modules/oct" element={<OCT />} />
              <Route path="/modules/image-processing" element={<ImageProcessing />} />
              <Route path="/modules/sim" element={<SIM />} />
              <Route path="/modules/system-builder" element={<SystemBuilder />} />
              <Route path="/modules/results-dashboard" element={<ResultsDashboard />} />
              <Route path="/modules/report" element={<ReportGenerator />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </InstrumentProvider>
    </div>
  );
}

export default App;
