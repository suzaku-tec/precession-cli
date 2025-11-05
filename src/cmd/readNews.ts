import fs from 'fs';
import path from 'path';
import logger from '../util/logger.ts';
import { Command } from 'commander';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, Heading, Content, PhrasingContent } from 'mdast';
import VoiceVoxPlayer from '../util/voiceVoxPlayer.ts';

const program = new Command();
program
  .requiredOption('-f, --file <readNewsFile>', 'news file to read')
  // .requiredOption('--fmt <readNewsFmt>', 'news file format');
  ;
program.parse(process.argv);
const options = program.opts();

const targetFile = path.resolve(options.file);

// Markdownファイル読み込み
const markdown = fs.readFileSync(targetFile, 'utf-8');
logger.debug(`Read news file: ${targetFile}`);

function getTextFromChildren(children: PhrasingContent[]): string {
  return children
    .map(child => {
      if ('value' in child && typeof child.value === 'string') {
        return child.value;
      }
      if ('children' in child && Array.isArray(child.children)) {
        return getTextFromChildren(child.children);
      }
      return '';
    })
    .join('');
}

function extractSectionText(tree: Root, sectionTitle: string): string[] {
  const nodes = tree.children;
  let capture = false;
  let sectionDepth = 0;
  let texts: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;

    // 指定の見出し開始判定
    if (node.type === 'heading') {
      const heading = node as Heading;
      const headingText = getTextFromChildren(heading.children);

      if (headingText === sectionTitle) {
        capture = true;
        sectionDepth = heading.depth;
        continue;
      }
      // 同じ階層以上の見出しに達したら終了
      if (capture && heading.depth <= sectionDepth) {
        break;
      }
    }

    if (capture) {
      // 配下としてテキストを蓄積（段落や他ノードも含め）
      if ('children' in node) {
        texts.push(getTextFromChildren((node as any).children));
      } else if ('value' in node && typeof (node as any).value === 'string') {
        texts.push((node as any).value);
      }
    }
  }

  return texts;
}

// パース
async function run() {
  const tree: Root = unified()
    .use(remarkParse)
    .parse(markdown);

  const text = extractSectionText(tree, '回答');
  for (const line of text) {
    const parts = line.split("。");
    for (const part of parts) {
      part.trim();
      await VoiceVoxPlayer.playVoiceVox(part);
    }
  }
}

run();
