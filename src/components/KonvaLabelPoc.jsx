import { useMemo, useState } from 'react';
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';

const PX_PER_IN = 220;
const LABEL_WIDTH_IN = 1.75;
const LABEL_HEIGHT_IN = 0.75;

const labelWidthPx = Math.round(LABEL_WIDTH_IN * PX_PER_IN);
const labelHeightPx = Math.round(LABEL_HEIGHT_IN * PX_PER_IN);
const stagePadding = 14;

const anchorsIn = [
  { key: 'logo', y: 0.05, label: '0.050"' },
  { key: 'navy', y: 0.205, label: '0.205"' },
  { key: 'dosage', y: 0.404, label: '0.404"' },
  { key: 'purity', y: 0.484, label: '0.484"' },
  { key: 'legal', y: 0.61, label: '0.610"' },
  { key: 'storage', y: 0.672, label: '0.672"' },
];

const toPx = (inchY) => Math.round(inchY * PX_PER_IN);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function KonvaLabelPoc({
  purityText = '≥99% Purity (HPLC-VERIFIED)',
  pdfPurityText = '≥99% Purity (HPLC-VERIFIED)',
  primaryColor = '#1F3A5F',
  secondaryColor = '#F76D00',
}) {
  const [logoPos, setLogoPos] = useState({ x: 0, y: toPx(0.05) - 2 });
  const [dosagePos, setDosagePos] = useState({ x: 0, y: toPx(0.404) - 6 });
  const [purityPos, setPurityPos] = useState({ x: 0, y: toPx(0.484) + 7 });
  const [showParityLayer, setShowParityLayer] = useState(true);

  const stageWidth = labelWidthPx + stagePadding * 2;
  const stageHeight = labelHeightPx + stagePadding * 2;

  const anchorLines = useMemo(
    () =>
      anchorsIn.map((anchor) => ({
        ...anchor,
        yPx: stagePadding + toPx(anchor.y),
      })),
    []
  );

  const purityDisplay = String(purityText || '').replace(/>=/g, '≥').trim();
  const pdfPurityDisplay = String(pdfPurityText || '').replace(/>=/g, '≥').trim();
  const parityStatus = purityDisplay === pdfPurityDisplay ? 'MATCH' : 'DIFF';

  return (
    <div className="rounded-xl border border-[#d5ddea] p-3 bg-[#fbfdff]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#11284a]">Konva Purity POC</h3>
        <label className="flex items-center gap-2 text-[10px] font-semibold text-[#4a6288]">
          <span>Parity Layer</span>
          <input
            type="checkbox"
            checked={showParityLayer}
            onChange={(event) => setShowParityLayer(event.target.checked)}
            className="h-3.5 w-3.5 rounded"
          />
        </label>
      </div>
      <div className="flex justify-center overflow-auto rounded-lg border border-[#d5ddea] bg-white p-2">
        <Stage width={stageWidth} height={stageHeight}>
          <Layer>
            <Rect
              x={stagePadding}
              y={stagePadding}
              width={labelWidthPx}
              height={labelHeightPx}
              cornerRadius={8}
              fill="#ffffff"
              stroke="#8ea2c4"
              strokeWidth={1}
            />

            <Rect
              x={stagePadding + Math.round((labelWidthPx - Math.round(1.65 * PX_PER_IN)) / 2)}
              y={stagePadding + toPx(0.205)}
              width={Math.round(1.65 * PX_PER_IN)}
              height={Math.round(0.12 * PX_PER_IN)}
              cornerRadius={4}
              fill={primaryColor}
            />

            <Rect
              x={stagePadding + Math.round((labelWidthPx - Math.round(1.65 * PX_PER_IN)) / 2)}
              y={stagePadding + toPx(0.484)}
              width={Math.round(1.65 * PX_PER_IN)}
              height={Math.round(0.1 * PX_PER_IN)}
              cornerRadius={12}
              fill={secondaryColor}
            />

            {anchorLines.map((anchor) => (
              <Group key={anchor.key}>
                <Line
                  points={[
                    stagePadding,
                    anchor.yPx,
                    stagePadding + labelWidthPx,
                    anchor.yPx,
                  ]}
                  stroke="#00a8ff"
                  strokeWidth={0.8}
                  opacity={0.45}
                />
                <Text
                  x={stagePadding + 4}
                  y={anchor.yPx - 10}
                  text={anchor.label}
                  fontSize={9}
                  fill="#008bd6"
                  fontStyle="bold"
                />
              </Group>
            ))}

            <Text
              draggable
              x={stagePadding + logoPos.x}
              y={stagePadding + logoPos.y}
              width={labelWidthPx}
              align="center"
              text="PEPTQ"
              fill="#1b2f53"
              fontSize={14}
              fontStyle="bold"
              onDragEnd={(event) => {
                const nextY = clamp(event.target.y() - stagePadding, 0, labelHeightPx - 16);
                setLogoPos({ x: 0, y: nextY });
              }}
            />

            <Text
              draggable
              x={stagePadding + dosagePos.x}
              y={stagePadding + dosagePos.y}
              width={labelWidthPx}
              align="center"
              text="10 mg"
              fill="#0d2345"
              fontSize={12}
              onDragEnd={(event) => {
                const nextY = clamp(event.target.y() - stagePadding, 0, labelHeightPx - 14);
                setDosagePos({ x: 0, y: nextY });
              }}
            />

            <Text
              draggable
              x={stagePadding + purityPos.x}
              y={stagePadding + purityPos.y}
              width={labelWidthPx}
              align="center"
              text={purityDisplay}
              fill="#ffffff"
              fontSize={10}
              fontStyle="bold"
              onDragEnd={(event) => {
                const nextY = clamp(event.target.y() - stagePadding, 0, labelHeightPx - 12);
                setPurityPos({ x: 0, y: nextY });
              }}
            />

            {showParityLayer && (
              <Group>
                <Rect
                  x={stagePadding + 6}
                  y={stagePadding + labelHeightPx - 38}
                  width={labelWidthPx - 12}
                  height={32}
                  cornerRadius={6}
                  fill="#eef4ff"
                  stroke={parityStatus === 'MATCH' ? '#30a46c' : '#d94848'}
                  strokeWidth={1}
                  opacity={0.95}
                />
                <Text
                  x={stagePadding + 12}
                  y={stagePadding + labelHeightPx - 34}
                  width={labelWidthPx - 24}
                  text={`Konva: ${purityDisplay}`}
                  fontSize={9}
                  fill="#11305f"
                  fontStyle="bold"
                  ellipsis
                />
                <Text
                  x={stagePadding + 12}
                  y={stagePadding + labelHeightPx - 22}
                  width={labelWidthPx - 24}
                  text={`PDF: ${pdfPurityDisplay}`}
                  fontSize={9}
                  fill="#11305f"
                  ellipsis
                />
                <Text
                  x={stagePadding + labelWidthPx - 62}
                  y={stagePadding + labelHeightPx - 34}
                  text={parityStatus}
                  fontSize={8}
                  fill={parityStatus === 'MATCH' ? '#16764a' : '#b42318'}
                  fontStyle="bold"
                />
              </Group>
            )}
          </Layer>
        </Stage>
      </div>
      <p className="mt-2 text-[10px] text-[#4a6288]">
        Drag logo, dosage, and purity placeholders. The parity strip verifies `≥` and full purity text against the locked PDF string.
      </p>
    </div>
  );
}
