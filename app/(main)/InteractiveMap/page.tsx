"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const WORLD_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// List of countries 
const SELECTED_COUNTRIES = [
  "Egypt", "Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait",
  "Bahrain", "Oman", "Yemen", "Iraq", "Syria", "Lebanon", "Jordan",
  "Palestine", "Turkey", "Iran", "Armenia", "Azerbaijan",
];
//Names of countries in Arabic
const TRANSLATIONS: Record<string, string> = {
  "Egypt": "مصر", "Saudi Arabia": "السعودية", "United Arab Emirates": "الإمارات",
  "Qatar": "قطر", "Kuwait": "الكويت", "Bahrain": "البحرين", "Oman": "عمان", "Yemen": "اليمن",
  "Iraq": "العراق", "Syria": "سوريا", "Lebanon": "لبنان", "Jordan": "الأردن", "Palestine": "فلسطين",
  "Turkey": "تركيا", "Iran": "إيران", "Armenia": "أرمينيا", "Azerbaijan": "أذربيجان",
};

interface VideoInfo {
  title: string;
  src: string;
  type: string;
  desc: string;
}

const VIDEO_DATA: Record<string, VideoInfo> = {
  "العراق": { title: "حضارة بلاد الرافدين", src: "/iraq.mp4", type: "video/mp4", desc: "لقطات من جمال الأماكن الأثرية والطبيعية في العراق." },
  "إيران": { title: "المدن والتاريخ الإيراني", src: "/iran.mp4", type: "video/mp4", desc: "الجمهورية الإسلامية إيران." },
  "لبنان": { title: "بيروت وجمال الطبيعة", src: "/Lebanon.mp4", type: "video/mp4", desc: "مقاطع ساحرة لجبال لبنان وساحل البحر الأبيض المتوسط." },
  "اليمن": { title: "العمارة اليمنية القديمة", src: "/yemen.mp4", type: "video/webm", desc: "لقطات مميزة للمباني الطينية في صنعاء القديمة." },
  "فلسطين": { title: "العمارة الفلسطينية القديمة", src: "/palatine.mp4", type: "video/webm", desc: "لقطات مميزة للمباني القديمة والمعالم التاريخية في فلسطين." },
};

export default function InteractiveMap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  useEffect(() => {
    const internalWidth = 850;
    const internalHeight = 650;

    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${internalWidth} ${internalHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    const projection = d3.geoMercator();
    const pathGenerator = d3.geoPath().projection(projection);

    d3.json(WORLD_TOPOJSON_URL).then((data: any) => {
      const worldCountries = topojson.feature(data, data.objects.countries) as any;

      // 1. استخراج باقي دول الشرق الأوسط المستقلة
      const otherCountries = worldCountries.features.filter((d: any) =>
        SELECTED_COUNTRIES.includes(d.properties.name) && d.properties.name !== "Palestine"
      );

      // 2. دمج أراضي فلسطين والأراضي المحتلة في مجسم جغرافي واحد (Merged Feature)
      const palestineGeometries = data.objects.countries.geometries.filter((g: any) =>
        g.properties && (g.properties.name === "Palestine" || g.properties.name === "Israel")
      );

      const palestineMerged = topojson.merge(data, palestineGeometries) as any;
      palestineMerged.properties = { name: "Palestine" };

      // 3. تجميع كافة المساحات
      const middleEastCountries = [...otherCountries, palestineMerged];

      projection.fitSize([internalWidth, internalHeight], {
        type: "FeatureCollection",
        features: middleEastCountries
      });

      svg.selectAll(".country")
        .data(middleEastCountries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", (d: any) => pathGenerator(d))
        .style("fill", "#cbd5e1")
        .style("stroke", "#ffffff")
        .style("stroke-width", "1.5px")
        .style("cursor", "pointer")
        .style("transition", "fill 0.2s ease")
        .on("click", (event: MouseEvent, d: any) => {
          const translatedName = TRANSLATIONS[d.properties.name] || d.properties.name;
          setActiveCountry(translatedName);
        })
        .on("mouseover", function(event: MouseEvent, d: any) {
          d3.select(this as SVGPathElement).style("fill", "#0284c7");
          const translatedName = TRANSLATIONS[d.properties.name] || d.properties.name;
          
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltip({
              show: true,
              text: translatedName,
              x: event.clientX - rect.left + 10,
              y: event.clientY - rect.top - 30
            });
          }
        })
        .on("mousemove", (event: MouseEvent) => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltip(prev => ({
              ...prev,
              x: event.clientX - rect.left + 10,
              y: event.clientY - rect.top - 30
            }));
          }
        })
        .on("mouseout", function() {
          d3.select(this as SVGPathElement).style("fill", "#cbd5e1");
          setTooltip(prev => ({ ...prev, show: false }));
        });
    }).catch(error => {
      console.error("Error loading TopoJSON:", error);
    });
  }, []);

  const getVideoInfo = (countryName: string | null): VideoInfo | null => {
    if (!countryName) return null;
    return VIDEO_DATA[countryName] || {
      title: `لا يوجد فيديو مخصص لـ ${countryName}`,
      src: "/default.mp4",
      type: "video/mp4",
      desc: `لا يوجد ملف فيديو مخصص لهذه الدولة حاليًا.`
    };
  };

  const currentVideo = getVideoInfo(activeCountry);

  return (
    <div className="w-full min-h-screen bg-slate-100 p-4 md:p-8 relative" dir="rtl">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 border-b border-slate-300 pb-4">
          غرب آسيا
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* حاوية الخريطة */}
          <div 
            ref={containerRef}
            className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-md border border-slate-200 relative overflow-hidden"
          >
            <svg ref={svgRef} className="w-full h-auto min-h-[350px] max-h-[550px] bg-slate-50 rounded-xl"></svg>

            {/* Tooltip متموقع بدقة داخل الخريطة */}
            {tooltip.show && (
              <div
                className="absolute z-50 pointer-events-none bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold transition-all duration-75 whitespace-nowrap"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y}px`,
                }}
              >
                {tooltip.text}
              </div>
            )}
          </div>

          {/* القائمة الجانبية والفيديو */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
              {currentVideo ? currentVideo.title : 'معلومات الدولة'}
            </h2>

            <div>
              {currentVideo ? (
                <div className="flex flex-col gap-3">
                  <video
                    key={currentVideo.src}
                    controls
                    autoPlay
                    className="w-full rounded-xl border border-slate-200 bg-black aspect-video object-cover"
                  >
                    <source src={currentVideo.src} type={currentVideo.type} />
                    متصفحك لا يدعم وسم الفيديو.
                  </video>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {currentVideo.desc}
                  </p>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400">
                  انقر على إحدى الدول لعرض الفيديو الخاص بها.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
