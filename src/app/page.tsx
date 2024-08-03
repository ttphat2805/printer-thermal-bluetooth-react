"use client";
import { useState } from "react";

export default function Home() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [connected, setConnected] = useState(false);
  const [services, setServices] = useState<BluetoothRemoteGATTService[]>([]);
  const [characteristics, setCharacteristics] = useState<
    BluetoothRemoteGATTCharacteristic[]
  >([]);

  const requestDevice = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'],
      });
      console.log("Device:", device);
      setDevice(device);
    } catch (error) {
      console.error("Error requesting device:", error);
    }
  };

  const connectToDevice = async () => {
    if (!device) return;
    try {
      const server = await device.gatt?.connect();
      // console.log("Server:", server?.getPrimaryService(""));
      setServer(server as any);
      setConnected(true);
      console.log("Connected to device:", device);
    } catch (error) {
      console.error("Error connecting to device:", error);
    }
  };

  const discoverServicesAndCharacteristics = async () => {
    if (!server) return;
    try {
      const services = await server.getPrimaryServices();
      console.log("Services:", services);
      setServices(services);

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        console.log("characteristics: ", characteristics);
        setCharacteristics(characteristics);
      }
    } catch (error) {
      console.error("Error discovering services and characteristics:", error);
    }
  };

  const printData = async (data: string) => {
    if (!characteristics.length) return;
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);

      let writeCharacteristic = null;
      for (const characteristic of characteristics) {
        if (
          characteristic.properties.writeWithoutResponse &&
          characteristic.properties.write
        ) {
          writeCharacteristic = characteristic;
          break;
        }
      }

      if (!writeCharacteristic) {
        console.error("No writable characteristic found.");
        return;
      }

      await writeCharacteristic.writeValue(encodedData);
      console.log("Data sent to characteristic:", writeCharacteristic.uuid);
    } catch (error) {
      console.error("Error sending data to printer:", error);
    }
  };

  const formatBill = (items: any, total: any) => {
    let bill = "Restaurant Name\n";
    bill += "Address Line 1\n";
    bill += "Address Line 2\n";
    bill += "Phone: 123-456-7890\n\n";
    bill += "Item           Qty   Price\n";
    bill += "--------------------------\n";

    items.forEach(
      (item: {
        name: string;
        qty: { toString: () => string };
        price: number;
      }) => {
        bill += `${item.name.padEnd(15)} ${item.qty
          .toString()
          .padEnd(4)} ${item.price.toFixed(2)}\n`;
      }
    );

    bill += "--------------------------\n";
    bill += `Total: ${total.toFixed(2)}\n`;
    bill += "Thank you for dining with us!\n";
    bill += "\n\n\n";

    return bill;
  };

  const printBill = () => {
    const items = [
      { name: "Nguyen Van Triet", qty: 2, price: 200.99 },
      { name: "Phi Ne", qty: 10, price: 229.99 },
      { name: "Huy Ne", qty: 20, price: 122.49 },
    ];
    const total = items.reduce((acc, item) => acc + item.qty * item.price, 0);
    const bill = formatBill(items, total);
    printData(bill);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Bluetooth Printer Interface</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <button
          onClick={requestDevice}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded mb-4 hover:bg-blue-600"
        >
          Request Device
        </button>
        <button
          onClick={connectToDevice}
          className={`w-full py-2 px-4 rounded mb-4 bg-green-500 hover:bg-green-600 text-white`}
        >
          Connect to Device
        </button>
        <button
          onClick={discoverServicesAndCharacteristics}
          className={`w-full py-2 px-4 rounded mb-4 g-purple-500 bg-purple-600 text-white`}
        >
          Discover Services and Characteristics
        </button>
        <button
          onClick={printBill}
          className={`w-full py-2 px-4 rounded bg-indigo-500 hover:bg-indigo-600 text-white`}
        >
          Print Bill
        </button>
        {connected && (
          <p className="mt-4 text-green-500">Connected to {device?.name}</p>
        )}
      </div>
      <div className="mt-6 w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Discovered Services</h3>
        <ul className="list-disc pl-5">
          {services.map((service) => (
            <li key={service.uuid} className="mb-2">
              {service.uuid}
            </li>
          ))}
        </ul>
        <h3 className="text-xl font-semibold mb-4">
          Discovered Characteristics
        </h3>
        <ul className="list-disc pl-5">
          {characteristics.map((characteristic) => (
            <li key={characteristic.uuid} className="mb-2">
              {characteristic.uuid}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
