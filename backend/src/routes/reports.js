const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const SensorData = require('../models/SensorData');
const DiseaseResult = require('../models/DiseaseResult');
const { protect } = require('../middleware/auth');

// ─── GET /api/reports ─────────────────────────────────────
router.get('/reports', protect, async (req, res) => {
  try {
    const { from, to, type = 'weekly' } = req.query;
    const end   = to   ? new Date(to)   : new Date();
    const start = from ? new Date(from) : new Date(end - 7 * 24 * 60 * 60 * 1000);

    const [sensorData, diseaseData, stats] = await Promise.all([
      SensorData.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              year:  { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day:   { $dayOfMonth: '$timestamp' },
            },
            avg_moisture:    { $avg: '$moisture' },
            avg_temperature: { $avg: '$temperature' },
            avg_humidity:    { $avg: '$humidity' },
            avg_ph:          { $avg: '$ph' },
            avg_nitrogen:    { $avg: '$nitrogen' },
            avg_phosphorus:  { $avg: '$phosphorus' },
            avg_potassium:   { $avg: '$potassium' },
            readings:        { $sum: 1 },
            date:            { $first: '$timestamp' },
          },
        },
        { $sort: { date: 1 } },
      ]),

      DiseaseResult
        .find({ user: req.user._id, timestamp: { $gte: start, $lte: end } })
        .sort({ timestamp: -1 })
        .lean(),

      SensorData.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            min_moisture: { $min: '$moisture' },
            max_moisture: { $max: '$moisture' },
            avg_moisture: { $avg: '$moisture' },
            avg_temp:     { $avg: '$temperature' },
            min_temp:     { $min: '$temperature' },
            max_temp:     { $max: '$temperature' },
            avg_ph:       { $avg: '$ph' },
            avg_nitrogen: { $avg: '$nitrogen' },
            avg_phosphorus: { $avg: '$phosphorus' },
            avg_potassium:  { $avg: '$potassium' },
            total_readings: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      period: { from: start, to: end, type },
      summary: stats[0] || {},
      daily_data: sensorData,
      disease_events: diseaseData,
      generated_at: new Date(),
    });
  } catch (err) {
    console.error('[REPORTS ERROR]', err);
    res.status(500).json({ error: 'Failed to generate report data' });
  }
});

// ─── GET /api/reports/download ───────────────────────────
router.get('/reports/download', protect, async (req, res) => {
  try {
    const { type = 'weekly' } = req.query;
    const end   = new Date();
    const start = new Date(end - 7 * 24 * 60 * 60 * 1000);

    const [sensorData, stats] = await Promise.all([
      SensorData.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { year: { $year: '$timestamp' }, month: { $month: '$timestamp' }, day: { $dayOfMonth: '$timestamp' } },
            avg_moisture: { $avg: '$moisture' }, avg_temperature: { $avg: '$temperature' },
            avg_ph: { $avg: '$ph' }, avg_nitrogen: { $avg: '$nitrogen' },
            avg_phosphorus: { $avg: '$phosphorus' }, avg_potassium: { $avg: '$potassium' },
            date: { $first: '$timestamp' },
          },
        },
        { $sort: { date: 1 } },
      ]),
      SensorData.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        { $group: { _id: null, avg_moisture: { $avg: '$moisture' }, avg_temp: { $avg: '$temperature' }, avg_ph: { $avg: '$ph' }, avg_n: { $avg: '$nitrogen' }, total: { $sum: 1 } } },
      ]),
    ]);

    // Build PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=AgriDrishti_Report_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#1a5c2a');
    doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text('🌱 AgriDrishti', 50, 25);
    doc.fontSize(11).font('Helvetica').text('Smart Farm Report — ' + type.charAt(0).toUpperCase() + type.slice(1), 50, 52);
    doc.fillColor('#000').moveDown(3);

    // Period
    doc.fontSize(11).fillColor('#5a7464').text(
      `Period: ${start.toDateString()} – ${end.toDateString()}   |   Generated: ${new Date().toDateString()}`,
      50, 100
    );

    doc.moveDown(2);

    // Summary section
    const s = stats[0] || {};
    doc.fontSize(14).fillColor('#1a5c2a').font('Helvetica-Bold').text('Summary Statistics', 50, 130);
    doc.moveTo(50, 148).lineTo(550, 148).strokeColor('#d4eada').stroke();

    const summaryRows = [
      ['Average Soil Moisture', s.avg_moisture ? s.avg_moisture.toFixed(1) + '%' : 'N/A'],
      ['Average Temperature',   s.avg_temp ? s.avg_temp.toFixed(1) + '°C' : 'N/A'],
      ['Average Soil pH',       s.avg_ph ? s.avg_ph.toFixed(2) : 'N/A'],
      ['Average Nitrogen',      s.avg_n ? s.avg_n.toFixed(0) + ' mg/kg' : 'N/A'],
      ['Total Readings',        s.total ? s.total.toString() : '0'],
    ];

    let y = 158;
    doc.font('Helvetica').fontSize(11);
    summaryRows.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(50, y - 4, 500, 22).fill('#f4f9f5');
      doc.fillColor('#1a2b1e').text(label, 60, y).text(value, 400, y);
      y += 22;
    });

    // Daily data table
    if (sensorData.length > 0) {
      doc.moveDown(2);
      doc.fontSize(14).fillColor('#1a5c2a').font('Helvetica-Bold').text('Daily Sensor Readings', 50, y + 20);
      doc.moveTo(50, y + 38).lineTo(550, y + 38).strokeColor('#d4eada').stroke();

      y += 50;
      const headers = ['Date', 'Moisture%', 'Temp°C', 'pH', 'N', 'P', 'K'];
      const widths  = [100, 65, 65, 55, 55, 55, 55];
      let x = 50;
      doc.fontSize(9).fillColor('#1a5c2a').font('Helvetica-Bold');
      headers.forEach((h, i) => { doc.text(h, x, y); x += widths[i]; });

      y += 16;
      doc.font('Helvetica').fontSize(9).fillColor('#1a2b1e');
      sensorData.forEach((row, idx) => {
        if (y > 720) { doc.addPage(); y = 50; }
        if (idx % 2 === 0) doc.rect(50, y - 3, 500, 18).fill('#f4f9f5').fillColor('#1a2b1e');
        x = 50;
        const values = [
          new Date(row.date).toLocaleDateString('en-IN'),
          row.avg_moisture?.toFixed(1) || '-',
          row.avg_temperature?.toFixed(1) || '-',
          row.avg_ph?.toFixed(2) || '-',
          row.avg_nitrogen?.toFixed(0) || '-',
          row.avg_phosphorus?.toFixed(0) || '-',
          row.avg_potassium?.toFixed(0) || '-',
        ];
        values.forEach((v, i) => { doc.text(v, x, y); x += widths[i]; });
        y += 18;
      });
    }

    // Footer
    doc.fontSize(9).fillColor('#9ca3af')
       .text('Generated by AgriDrishti Smart Farming System', 50, doc.page.height - 40, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('[PDF REPORT ERROR]', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

module.exports = router;
