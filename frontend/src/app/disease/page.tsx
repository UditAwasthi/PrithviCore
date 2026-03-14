'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Upload, Bug, CheckCircle, AlertTriangle, XCircle, History } from 'lucide-react';
import { AxiosError } from 'axios';
import AppLayout from '@/components/layout/AppLayout';
import { diseaseAPI } from '@/lib/api';

interface DetectionResult {
  disease: string; confidence: number; severity: string;
  treatment: string; affected_area_percent?: number;
}
interface HistoryItem { _id: string; disease_name: string; severity: string; confidence: number; timestamp: string; }

const SEV = {
  none:     'text-agri-700 bg-agri-50',
  low:      'text-blue-700 bg-blue-50',
  moderate: 'text-amber-700 bg-amber-50',
  high:     'text-orange-700 bg-orange-50',
  critical: 'text-red-700 bg-red-50',
} as const;
type SevKey = keyof typeof SEV;

const CROPS = ['Tomato','Potato','Corn','Apple','Grape','Pepper','Peach','Cherry','Strawberry','Squash','Soybean','Wheat','Rice'];

export default function DiseasePage() {
  const qc = useQueryClient();
  const [preview,  setPreview]  = useState<string | null>(null);
  const [cropType, setCropType] = useState('');

  const { data: historyData } = useQuery('disease-history', () =>
    diseaseAPI.history({ limit: 10 }).then((r) => r.data)
  );
  const history = historyData as { results?: HistoryItem[] } | undefined;

  const detect = useMutation(
    (fd: FormData) => diseaseAPI.detect(fd).then((r) => r.data as DetectionResult),
    {
      onSuccess: () => { qc.invalidateQueries('disease-history'); toast.success('Analysis complete!'); },
      onError: (err: unknown) => {
        const msg = err instanceof AxiosError ? (err.response?.data?.error ?? 'Detection failed') : 'Detection failed';
        toast.error(typeof msg === 'string' ? msg : 'Detection failed. Is the AI service running?');
      },
    }
  );

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    const fd = new FormData();
    fd.append('image', f);
    if (cropType) fd.append('crop_type', cropType);
    detect.mutate(fd);
  }, [cropType, detect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const result = detect.data;
  const sevCls = SEV[(result?.severity as SevKey) ?? 'moderate'];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-agri-700 flex items-center gap-2"><Bug size={24} /> Disease Detection</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a clear leaf photo to identify plant diseases using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="space-y-4">
          <div>
            <label htmlFor="crop-select" className="block text-sm font-semibold text-agri-700 mb-1.5">Crop Type (optional)</label>
            <select id="crop-select" value={cropType} onChange={(e) => setCropType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-agri-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-agri-300">
              <option value="">Auto-detect</option>
              {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div {...getRootProps()} className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-agri-500 bg-agri-50' : 'border-agri-200 hover:border-agri-400 hover:bg-agri-50/50'}
            ${detect.isLoading ? 'pointer-events-none opacity-70' : ''}`}>
            <input {...getInputProps()} />
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Leaf preview" className="max-h-56 mx-auto rounded-xl object-contain" />
                {detect.isLoading && (
                  <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl animate-spin inline-block">🔬</span>
                      <p className="font-semibold text-agri-700 mt-2">Analyzing leaf…</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4">
                <Upload size={36} className="mx-auto mb-3 text-agri-300" />
                <p className="font-semibold text-agri-700">{isDragActive ? 'Drop here' : 'Drag & drop a leaf photo'}</p>
                <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
                <p className="text-xs text-gray-300 mt-3">JPG, PNG, WEBP · Max 10 MB</p>
              </div>
            )}
          </div>

          {preview && !detect.isLoading && (
            <button onClick={() => { setPreview(null); detect.reset(); }}
              className="w-full py-2 text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-gray-200">
              Clear &amp; Upload New Image
            </button>
          )}

          <div className="bg-agri-50 rounded-2xl p-4 text-sm text-agri-700 border border-agri-100">
            <p className="font-bold mb-2">📸 Tips for best results:</p>
            <ul className="space-y-1 text-xs text-agri-600 list-disc list-inside">
              <li>Use natural daylight, avoid shadows</li>
              <li>Capture the full leaf including edges</li>
              <li>Photo should be sharp and in focus</li>
              <li>Include visible symptoms in the frame</li>
            </ul>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {result ? (
            <div className="bg-white rounded-2xl border border-agri-100 p-6 shadow-sm space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-agri-700">Analysis Result</h3>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold capitalize ${sevCls}`}>
                  {result.severity === 'none' || result.severity === 'low' ? <CheckCircle size={14} /> :
                   result.severity === 'critical' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                  {result.severity}
                </span>
              </div>
              <div className={`p-4 rounded-xl ${sevCls}`}>
                <p className="text-lg font-extrabold">{result.disease}</p>
                <p className="text-sm mt-0.5 opacity-80">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                  <span>Confidence</span><span>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-agri-400 to-agri-600 rounded-full transition-all duration-700"
                    style={{ width: `${result.confidence * 100}%` }} />
                </div>
              </div>
              {result.affected_area_percent !== undefined && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Estimated Affected Area</p>
                  <p className="text-2xl font-black text-amber-600">{result.affected_area_percent.toFixed(1)}%</p>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1.5">Recommended Treatment</p>
                <p className="text-sm text-amber-900">{result.treatment}</p>
              </div>
            </div>
          ) : !detect.isLoading && (
            <div className="bg-white rounded-2xl border border-dashed border-agri-200 p-10 text-center">
              <div className="text-4xl mb-3">🌿</div>
              <p className="font-semibold text-gray-500">Upload a leaf photo to see results here</p>
              <p className="text-xs text-gray-300 mt-2">Supports 38 crop diseases</p>
            </div>
          )}
        </div>
      </div>

      {/* History table */}
      {(history?.results?.length ?? 0) > 0 && (
        <div className="mt-8">
          <h3 className="font-bold text-agri-700 mb-4 flex items-center gap-2"><History size={16} /> Detection History</h3>
          <div className="bg-white rounded-2xl border border-agri-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-agri-50 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {['Disease','Severity','Confidence','Date'].map((h) => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history!.results!.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-agri-50/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.disease_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${SEV[(r.severity as SevKey) ?? 'moderate']}`}>{r.severity}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{(r.confidence * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-gray-400">{format(new Date(r.timestamp), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
