import React from 'react';
import { Argb32 } from '../lib/datas-bin';

interface TilesheetPaletteProps {
  paletteIndex: number;
  palettes: Argb32[][];
  onChangePalette: (index: number) => void;
}

const TilesheetPalette = ({ paletteIndex, palettes, onChangePalette }: TilesheetPaletteProps) => {
  function onPaletteClick(index: number) {
    onChangePalette(index);
  }

  return (
    <ul className="px-1 py-1 flex flex-col items-center">
      {palettes.map((palette, i) => (
        <li
          key={i}
          onClick={() => onPaletteClick(i)}
          className={
            i === paletteIndex
              ? `outline outline-blue-500 relative z-10 block`
              : `block`
          }
        >
          <ul className="flex">
            {palette.map((color, j) => (
              <li key={j} className="flex">
                {color.a > 0 ? (
                  <div
                    className="w-7 h-7"
                    style={{
                      backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                    }}
                  />
                ) : (
                  <div className="w-7 h-7" />
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};

export default TilesheetPalette;