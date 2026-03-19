'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Upload, Bug, CheckCircle, AlertTriangle, XCircle, History } from 'lucide-react';
import { AxiosError } from 'axios';
import AppLayout from '@/components/layout/AppLayout';
import { diseaseAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface DetectionResult {
  disease: string; confidence: number; severity: string;
  treatment: string; affected_area_percent?: number;
}
interface HistoryItem { _id: string; disease_name: string; severity: string; confidence: number; timestamp: string; }

const SEV = {
  none:     'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  low:      'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
  moderate: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  high:     'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
} as const;
type SevKey = keyof typeof SEV;

const CROPS = ['Tomato','Potato','Corn','Apple','Grape','Pepper','Peach','Cherry','Strawberry','Squash','Soybean','Wheat','Rice'];

export default function DiseasePage() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState('');

  const { data: historyData, isLoading: historyLoading } = useQuery('disease-history', () =>
    diseaseAPI.history({ limit: 10 }).then((r) => r.data)
  );
  const history = historyData as { results?: HistoryItem[] } | undefined;

  const detect = useMutation(
    (fd: FormData) => diseaseAPI.detect(fd).then((r) => r.data as DetectionResult),
    {
      onSuccess: () => { qc.invalidateQueries('disease-history'); toast.success('Analysis complete!', { id: 'disease-success' }); },
      onError: (err: unknown) => {
        const msg = err instanceof AxiosError ? (err.response?.data?.error ?? 'Detection failed') : 'Detection failed';
        toast.error(typeof msg === 'string' ? msg : 'Detection failed. Is the AI service running?', { id: 'disease-error' });
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Bug size={26} className="text-emerald-500" /> Disease Detection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a clear leaf photo to identify plant diseases using AI</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Upload */}
        <div className="space-y-4 flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Upload size={17} className="text-muted-foreground" /> Analyze Leaf
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex-1 flex flex-col space-y-4">
              <div>
                <label htmlFor="crop-select" className="block text-sm font-medium text-foreground mb-1.5">Crop Type (Optional)</label>
                <select id="crop-select" value={cropType} onChange={(e) => setCropType(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer text-foreground">
                  <option value="">Auto-detect</option>
                  {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div {...getRootProps()} className={cn(
                "relative flex-1 min-h-[240px] flex flex-col outline-dashed outline-2 outline-offset-[-2px] rounded-2xl p-8 text-center cursor-pointer transition-all items-center justify-center overflow-hidden",
                isDragActive ? "outline-emerald-500 bg-emerald-500/5" : "outline-border/50 hover:outline-emerald-500/40 hover:bg-muted/20",
                detect.isLoading && "pointer-events-none opacity-80"
              )}>
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Leaf preview" className="max-h-56 object-contain rounded-xl shadow-sm z-10" />
                    {detect.isLoading && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                        <div className="text-center animate-pulse">
                          <span className="text-3xl inline-block mb-2">🔬</span>
                          <p className="font-medium text-foreground text-sm">Analyzing leaf…</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground">
                      <Upload size={24} />
                    </div>
                    <p className="font-semibold text-foreground text-base mb-1">{isDragActive ? 'Drop image here' : 'Drag & drop a leaf photo'}</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-3 uppercase tracking-wider font-medium">JPG, PNG, WEBP · Max 10 MB</p>
                  </div>
                )}
              </div>

              {preview && !detect.isLoading && (
                <Button variant="outline" onClick={(e) => { e.stopPropagation(); setPreview(null); detect.reset(); }} className="w-full text-red-500 border-red-500/20 hover:bg-red-500/5">
                  Clear & Upload New
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="bg-emerald-500/5 rounded-xl p-4 text-sm text-foreground border border-emerald-500/15 flex items-start gap-3">
            <span className="text-xl mt-0.5">📸</span>
            <div>
              <p className="font-semibold mb-1 text-sm">Tips for best results</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Use natural daylight, avoid flash</li>
                <li>Capture the entire leaf including edges</li>
                <li>Ensure the photo is sharp and focused</li>
                <li>Center visible symptoms in frame</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="h-full">
          {result ? (
            <Card className="h-full animate-fade-in flex flex-col">
              <CardHeader className="pb-3 border-b border-border/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Analysis Result</CardTitle>
                  <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", sevCls)}>
                    {result.severity === 'none' || result.severity === 'low' ? <CheckCircle size={13} /> :
                     result.severity === 'critical' ? <XCircle size={13} /> : <AlertTriangle size={13} />}
                    {result.severity}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-5 flex-1 flex flex-col space-y-5">
                <div className={cn("p-4 rounded-xl border", sevCls)}>
                  <p className="text-xl font-black tracking-tight mb-1">{result.disease}</p>
                  <p className="text-sm font-medium opacity-70">AI Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                    <span>Confidence</span><span>{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden border border-border/20">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${result.confidence * 100}%` }} />
                  </div>
                </div>

                {result.affected_area_percent !== undefined && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Affected Area</p>
                    <p className="text-2xl font-black text-foreground">{result.affected_area_percent.toFixed(1)}<span className="text-lg text-muted-foreground">%</span></p>
                  </div>
                )}

                <div className="flex-1 bg-muted/15 border border-border/20 rounded-xl p-4 flex flex-col">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Treatment
                  </p>
                  <div className="text-sm text-muted-foreground leading-relaxed bg-background/50 rounded-lg p-3 flex-1 border border-border/15">
                    {result.treatment}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !detect.isLoading ? (
            <Card className="h-full border-dashed flex flex-col items-center justify-center p-10 text-center bg-card/40">
              <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-5 text-3xl opacity-40">🌿</div>
              <h3 className="font-bold text-lg text-foreground mb-1.5">Awaiting Image</h3>
              <p className="text-sm text-muted-foreground max-w-[230px] leading-relaxed">Upload a leaf photo to see AI analysis results.</p>
              <div className="mt-6 px-4 py-1.5 bg-background/60 border border-border/30 rounded-full text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                38+ Diseases Supported
              </div>
            </Card>
          ) : (
             <Card className="h-full flex flex-col p-6 animate-pulse">
                <Skeleton className="h-8 w-1/3 mb-5" />
                <Skeleton className="h-20 w-full rounded-xl mb-5" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-5" />
                <Skeleton className="h-36 w-full rounded-xl flex-1" />
             </Card>
          )}
        </div>
      </div>

      {/* History */}
      {historyLoading ? (
         <div className="mt-8 space-y-3">
           <Skeleton className="h-7 w-44" />
           <Skeleton className="h-36 w-full rounded-xl" />
         </div>
      ) : (history?.results?.length ?? 0) > 0 && (
        <div className="mt-8 animate-fade-in">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight text-lg">
            <History size={18} className="text-emerald-500" /> Detection History
          </h3>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-muted/20">
                  <tr className="border-b border-border/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3.5">Disease</th>
                    <th className="px-5 py-3.5">Severity</th>
                    <th className="px-5 py-3.5">Confidence</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {history!.results!.map((r) => (
                    <tr key={r._id} className="hover:bg-muted/15 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-foreground">{r.disease_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", SEV[(r.severity as SevKey) ?? 'moderate'])}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                           {(r.confidence * 100).toFixed(0)}%
                           <div className="w-14 h-1.5 bg-muted/50 rounded-full overflow-hidden hidden sm:block">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.confidence * 100}%` }} />
                           </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs font-medium">
                        {format(new Date(r.timestamp), 'MMM d, yyyy · h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
