import React, { useState } from "react";
import jsPDF from "jspdf";
import QRious from "qrious";
import moment from "moment";
import { Button } from "antd";

export default function PdfGenerator ({ user }) {
  const [qrData, setQrData] = useState("Juanito Perez");
  const nombre = user?.username || user?.first_name;
  const local = user?.branch?.name || 'Sin sucursal';
  const fecha = moment().format('DD-MM-YYYY HH:mm:ss');
  const categoria = user?.category_bonus || 'Sin Categoria';
  const bonos = "BonoAmigo";
  const montoBonos = 2000;
  const generatePDF = () => {
    const doc = new jsPDF('p', 'pt', [200, 300] );

    doc.setFontSize(30);
    doc.text(nombre, 10, 30); 
    doc.setFontSize(14);
    doc.text(`Local: ${local}`, 10, 50); 
    doc.text(`Fecha: ${fecha}`, 10, 65); 
    doc.text(`Categoría: ${categoria?.name}`, 10, 80);
    doc.text(`Monto categoria: ${categoria?.base_amount}`, 10, 95); 
    doc.text(`Bonos: ${bonos}`, 10, 110);
    doc.text(`Monto de Bonos: ${montoBonos}`, 10, 125);

    const qr = new QRious({
      value: 'https://rentamania.cl',
      size: 200,
    });

    const qrImg = qr.toDataURL();
    doc.addImage(qrImg, "PNG", 10, 150, 120, 120);
    doc.save("receipt.pdf");
  };

  const generateQRCode = () => {
    const qr = new QRious({
      element: document.getElementById("qr-code"),
      value: qrData,
      size: 100,
    });
  };

  React.useEffect(() => {
    generateQRCode();
  }, [qrData]);

  return (
    <div>
      <div
        id="pdf-content"
        style={{
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          width: "300px",
          height: "auto", 
        }}
      >

        <h2 style={{ fontSize: "20px", margin: "0" }}>{nombre}</h2>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>{local}</p>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>{fecha}</p>

        <hr style={{ margin: "10px 0" }} />

        <p style={{ margin: "5px 0", fontSize: "14px" }}>Categoría: {categoria?.name || 'Sin Categoria'}</p>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Monto categoria: {categoria?.base_amount || 'Sin Categoria'}</p>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Bonos: BonoAmigo</p>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>Monto bono: 2000</p>

        <div style={{ marginTop: "10px" }}>
          <canvas id="qr-code" />
        </div>
      </div>

      <Button onClick={generatePDF} style={{ margin: "20px" }}>
        Generar PDF
      </Button>
    </div>
  );
};
