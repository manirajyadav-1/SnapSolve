/*
MCQ React Client
Single-file React app (App.jsx) that integrates with the Spring Boot endpoints:

- GET  /api/mcq/history
- GET  /api/mcq/results/{id}
- POST /api/mcq/upload        (multipart/form-data, field name: "image")
- POST /api/mcq/paste-image  (JSON { base64Image: "data:image/png;base64,..." })
- GET  /api/mcq/results/{id}/pdf   (application/pdf) - download
- GET  /api/mcq/results/{id}/word  (application/vnd.openxmlformats-officedocument.wordprocessingml.document) - download

Usage:
1. Create a React app (e.g. with Vite or Create React App).
2. Add Tailwind to your project (optional but styling expects Tailwind classes).
3. Replace src/App.jsx with this file and run the dev server (localhost:3000).

Notes:
- The backend must be running on the same origin or CORS must allow requests from http://localhost:3000 (your backend already sets this in the controller).
- This app provides: file upload, paste-from-clipboard image, history list, view result, download PDF/Word.
*/
import React, { useEffect, useState, useRef } from "react";

function App() {
  const [history, setHistory] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [pastePreview, setPastePreview] = useState(null);
  const pasteRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("http://localhost:8080/api/mcq/history");
      if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    setError(null);
    const fileInput = document.getElementById("imageInput");
    if (!fileInput.files || fileInput.files.length === 0) {
      setError("Please choose a file first.");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const res = await fetch("http://localhost:8080/api/mcq/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed: ${res.status}`);
      }

      const savedSet = await res.json();
      setSelectedSet(savedSet);
      // refresh history
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
      fileInput.value = null;
    }
  }

  // Convert file to base64 data URL
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePasteUpload(e) {
    e.preventDefault();
    setError(null);
    if (!pastePreview) {
      setError("No pasted image to upload. Paste an image into the box first.");
      return;
    }

    try {
      setUploading(true);
      const body = { base64Image: pastePreview };
      const res = await fetch("http://localhost:8080/api/mcq/paste-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Paste upload failed: ${res.status}`);
      }
      const saved = await res.json();
      setSelectedSet(saved);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
      setPastePreview(null);
    }
  }

  // Handler to support CTRL+V / right-click paste into the paste area
  async function handlePaste(e) {
    setError(null);
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        try {
          const dataUrl = await fileToDataUrl(blob);
          setPastePreview(dataUrl);
          return;
        } catch (err) {
          console.error(err);
        }
      }
    }

    setError("No image in clipboard to paste.");
  }

  // Also support dropping files into paste area
  async function handleDrop(e) {
    e.preventDefault();
    const items = e.dataTransfer.files;
    if (!items || items.length === 0) return;
    const file = items[0];
    try {
      const dataUrl = await fileToDataUrl(file);
      setPastePreview(dataUrl);
    } catch (err) {
      console.error(err);
      setError("Could not read dropped file.");
    }
  }

  function allowDrop(e) {
    e.preventDefault();
  }

  async function viewResult(id) {
    try {
      const res = await fetch(`http://localhost:8080/api/mcq/results/${id}`);
      if (!res.ok) throw new Error(`Could not fetch result ${id}`);
      const data = await res.json();
      setSelectedSet(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  async function downloadFile(id, type) {
    // type: 'pdf' or 'word'
    try {
      const res = await fetch(`http://localhost:8080/api/mcq/results/${id}/${type}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Download failed: ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mcq-results-${id}.${type === "pdf" ? "pdf" : "docx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">SnapSolve — MCQ Screenshot Uploader</h1>
          <p className="text-sm text-gray-600 mt-1">Upload screenshots or paste an image to extract MCQs.</p>
        </header>

        <main className="grid md:grid-cols-2 gap-6">
          <section className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-3">Upload Image (File)</h2>
            <form onSubmit={handleFileUpload}>
              <input id="imageInput" type="file" accept="image/*" className="mb-3" />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload & Process"}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={() => {
                    document.getElementById("imageInput").value = null;
                    setError(null);
                  }}
                >
                  Reset
                </button>
              </div>
            </form>

            <hr className="my-4" />

            <h2 className="font-semibold mb-3">Paste Image (Clipboard)</h2>
            <div
              ref={pasteRef}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={allowDrop}
              tabIndex={0}
              className="border-dashed border-2 border-gray-300 rounded p-4 text-center hover:border-gray-400 focus:outline-none"
              style={{ minHeight: 150 }}
            >
              <p className="text-sm text-gray-600">Click here and press <kbd className="bg-gray-100 px-1 rounded">Ctrl+V</kbd> / <kbd className="bg-gray-100 px-1 rounded">Cmd+V</kbd> or drop an image.</p>

              {pastePreview ? (
                <div className="mt-3">
                  <img src={pastePreview} alt="pasted" className="mx-auto max-h-48 object-contain" />
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      onClick={() => setPastePreview(null)}
                      className="px-3 py-1 rounded bg-gray-200"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handlePasteUpload}
                      className="px-3 py-1 rounded bg-green-600 text-white"
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Upload Pasted Image"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-3">No image pasted yet.</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </section>

          <section className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-3">Previous Results</h2>
            <div className="space-y-2 max-h-80 overflow-auto">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No history found. Upload an image to get started.</p>
              ) : (
                history.map((set) => (
                  <div key={set.id} className="flex items-center justify-between border p-2 rounded">
                    <div>
                      <div className="font-medium">{set.title || `Set #${set.id}`}</div>
                      <div className="text-xs text-gray-500">{new Date(set.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 rounded bg-blue-600 text-white text-sm"
                        onClick={() => viewResult(set.id)}
                      >
                        View
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-gray-200 text-sm"
                        onClick={() => downloadFile(set.id, "pdf")}
                      >
                        PDF
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-gray-200 text-sm"
                        onClick={() => downloadFile(set.id, "word")}
                      >
                        DOCX
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={fetchHistory}>Refresh</button>
              <button className="px-3 py-1 rounded bg-white border" onClick={() => { setHistory([]); setSelectedSet(null); }}>Clear View</button>
            </div>
          </section>

          <section className="md:col-span-2 bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-3">Selected Result</h2>
            {selectedSet ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{selectedSet.title}</h3>
                    <div className="text-xs text-gray-500">{new Date(selectedSet.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded bg-gray-200" onClick={() => downloadFile(selectedSet.id, "pdf")}>Download PDF</button>
                    <button className="px-3 py-1 rounded bg-gray-200" onClick={() => downloadFile(selectedSet.id, "word")}>Download DOCX</button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedSet.questions && selectedSet.questions.length > 0 ? (
                    selectedSet.questions.map((q, i) => (
                      <div key={i} className="p-3 border rounded">
                        <div className="font-medium">{q.questionText}</div>
                        {q.options && (
                          <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                            {q.options.map((opt, idx) => (
                              <li key={idx}>{opt}</li>
                            ))}
                          </ul>
                        )}
                        {q.answer && <div className="text-sm text-green-700 mt-2">Answer: {q.answer}</div>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No questions available for this set.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a result from the list to view extracted questions and download documents.</p>
            )}
          </section>
        </main>

        <footer className="mt-6 text-sm text-gray-500 text-center">SnapSolve • Frontend Example</footer>
      </div>
    </div>
  );
}

export default App;
