// jest.setup.js
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// TextEncoder/TextDecoderのpolyfill (Node.js環境でのテスト用)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
