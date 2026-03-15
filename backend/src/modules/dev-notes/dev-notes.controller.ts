import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';

class AddNoteDto {
  @IsIn(['note', 'response', 'comment'])
  type: 'note' | 'response' | 'comment';

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

const NOTES_FILE = join(process.cwd(), 'dev-notes.json');

export interface DevNoteEntry {
  id: string;
  type: 'note' | 'response' | 'comment';
  text: string;
  page?: string;
  ts: string;
  parentId?: string;
}

async function readNotes(): Promise<DevNoteEntry[]> {
  try {
    const raw = await readFile(NOTES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : (parsed.entries ?? []);
  } catch {
    return [];
  }
}

async function writeNotes(entries: DevNoteEntry[]): Promise<void> {
  await writeFile(NOTES_FILE, JSON.stringify(entries, null, 2));
}

@Public()
@Controller('dev-notes')
export class DevNotesController {
  @Get()
  async getAll() {
    return readNotes();
  }

  @Post()
  async addEntry(@Body() body: AddNoteDto) {
    const entries = await readNotes();
    const entry: DevNoteEntry = {
      id: Date.now().toString(),
      type: body.type,
      text: body.text,
      page: body.page,
      ts: new Date().toISOString(),
      ...(body.parentId ? { parentId: body.parentId } : {}),
    };
    entries.unshift(entry);
    await writeNotes(entries);
    return entry;
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    const entries = await readNotes();
    // Remove the note and all its comments
    const filtered = entries.filter((e) => e.id !== id && e.parentId !== id);
    await writeNotes(filtered);
    return { ok: true };
  }

  @Delete()
  async clearAll() {
    await writeNotes([]);
    return { ok: true };
  }
}
