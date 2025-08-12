/** biome-ignore-all lint/suspicious/noExplicitAny: xxx */
'use client';

import type { ComponentProps } from 'react';
import { Cell, Pie, PieChart as PieChartPrimitive } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import { twMerge } from 'tailwind-merge';
import type { BaseChartProps } from './chart';
import {
  Chart,
  ChartTooltip,
  ChartTooltipContent,
  DEFAULT_COLORS,
  getColorValue,
} from './chart';

const sumNumericArray = (arr: number[]): number =>
  arr.reduce((sum, num) => sum + num, 0);

function calculateDefaultLabel(data: any[], valueKey: string): number {
  return sumNumericArray(data.map((dataPoint) => dataPoint[valueKey]));
}

function parseLabelInput(
  labelInput: string | undefined,
  valueFormatter: (value: number) => string,
  data: any[],
  valueKey: string
): string {
  return labelInput || valueFormatter(calculateDefaultLabel(data, valueKey));
}

interface PieChartProps<TValue extends ValueType, TName extends NameType>
  extends Omit<
    BaseChartProps<TValue, TName>,
    | 'hideGridLines'
    | 'hideXAxis'
    | 'hideYAxis'
    | 'xAxisProps'
    | 'yAxisProps'
    | 'displayEdgeLabelsOnly'
    | 'legend'
    | 'legendProps'
  > {
  variant?: 'pie' | 'donut';
  nameKey?: string;

  chartProps?: Omit<
    ComponentProps<typeof PieChartPrimitive>,
    'data' | 'stackOffset'
  >;

  label?: string;
  showLabel?: boolean;
  pieProps?: Omit<ComponentProps<typeof Pie>, 'data' | 'dataKey' | 'name'>;
}

function PieChart<TValue extends ValueType, TName extends NameType>({
  data = [],
  dataKey,
  colors = DEFAULT_COLORS,
  className,
  config,
  children,
  label,
  showLabel,

  // Components
  tooltip = true,
  tooltipProps,

  variant = 'pie',
  nameKey,

  chartProps,

  valueFormatter = (value: number) => value.toString(),
  pieProps,
  ...props
}: PieChartProps<TValue, TName>) {
  const parsedLabelInput = parseLabelInput(
    label,
    valueFormatter,
    data,
    dataKey
  );

  return (
    <Chart
      className={twMerge('aspect-square', className)}
      config={config}
      data={data}
      dataKey={dataKey}
      layout="radial"
      {...props}
    >
      {({ onLegendSelect }) => (
        <PieChartPrimitive
          data={data}
          margin={{
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
          }}
          onClick={() => {
            onLegendSelect(null);
          }}
          {...chartProps}
        >
          {showLabel && variant === 'donut' && (
            <text
              className="fill-fg font-medium"
              dominantBaseline="middle"
              textAnchor="middle"
              x="50%"
              y="50%"
            >
              {parsedLabelInput}
            </text>
          )}
          <Pie
            cx={pieProps?.cx ?? '50%'}
            cy={pieProps?.cy ?? '50%'}
            data={data}
            dataKey={dataKey}
            endAngle={pieProps?.endAngle ?? -270}
            innerRadius={variant === 'donut' ? '50%' : '0%'}
            isAnimationActive
            name={nameKey}
            startAngle={pieProps?.startAngle ?? 90}
            strokeLinejoin="round"
            {...pieProps}
          >
            {data.map((_, index) => (
              <Cell
                fill={getColorValue(
                  config?.[data[index]?.code || data[index]?.name]?.color ??
                    colors[index % colors.length]
                )}
                // biome-ignore lint/suspicious/noArrayIndexKey: xxx
                key={`cell-${index}`}
              />
            ))}
          </Pie>

          {tooltip && (
            <ChartTooltip
              content={
                typeof tooltip === 'boolean' ? (
                  <ChartTooltipContent
                    accessibilityLayer
                    labelSeparator={false}
                  />
                ) : (
                  tooltip
                )
              }
              {...tooltipProps}
            />
          )}

          {children}
        </PieChartPrimitive>
      )}
    </Chart>
  );
}

export type { PieChartProps };
export { PieChart };
