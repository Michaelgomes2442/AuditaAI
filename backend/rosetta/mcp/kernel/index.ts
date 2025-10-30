// RosettaOS MCP Kernel: Modular Tool Entry Point
// Exposes all kernel modules as MCP tools

import * as boot from './boot';
import * as persona from './persona';
import * as triTrack from './triTrack';
import * as speechcraft from './speechcraft';
import * as canons from './canons';

export const RosettaMCPKernel = {
  boot,
  persona,
  triTrack,
  speechcraft,
  canons
};
