"""PDF の後処理（Playwright の page.pdf で作った PDF を、町の文書として整える）。

WP4（scripts/pdf/）と共有する前提の関数。いまはハザードマップだけが使う（WP4 が scripts/pdf/ に移すときはこのまま写してよい）。

  finalize_pdf(src, dst, title=..., author=..., subject=..., keywords=..., created=datetime, lang="ja")

- 文書情報（Info）を作り直す: Title・Author・Subject・Keywords・CreationDate・ModDate（作中の日付）だけにする。
  Creator（HeadlessChrome…）と Producer（Skia/PDF…、pypdf）は残さない。
- XMP（/Metadata）を同じ値で書く（dc:title・dc:creator・dc:description・dc:language・pdf:Keywords・xmp の日付）。
  CreatorTool・Producer は書かない。
- /ViewerPreferences の DisplayDocTitle を true、/Lang を ja、/MarkInfo（タグ付き）は Chrome の出力を保つ。
- 全体を書き直して保存する（増分保存にしない＝%%EOF は1回）。
- 次のものがあれば止める: /JavaScript・/EmbeddedFile(s)・/OCProperties・/Thumb・/ActualText・リンク以外の注釈・埋め込みでないフォント。
"""
from __future__ import annotations

import datetime as dt
import re
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from pypdf.generic import BooleanObject, DictionaryObject, NameObject, StreamObject, TextStringObject

FORBIDDEN_KEYS = (b"/JavaScript", b"/EmbeddedFile", b"/OCProperties", b"/Thumb", b"/ActualText", b"/Prev")
TOOL_WORDS = re.compile(rb"Chrom|Skia|Playwright|Puppeteer|Headless|pdf-lib|wkhtmltopdf|ReportLab|PyMuPDF|MuPDF|pypdf|PyPDF|Next\.js|Claude|Cursor", re.I)


def pdf_date(t: dt.datetime) -> str:
    off = t.utcoffset() or dt.timedelta(0)
    sign = "+" if off >= dt.timedelta(0) else "-"
    mins = abs(int(off.total_seconds())) // 60
    return t.strftime("D:%Y%m%d%H%M%S") + f"{sign}{mins // 60:02d}'{mins % 60:02d}'"


def xmp_packet(title: str, author: str, subject: str, keywords: str, created: dt.datetime, lang: str) -> bytes:
    iso = created.isoformat()
    e = lambda s: escape(s, {'"': "&quot;"})
    body = f"""<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
   <dc:format>application/pdf</dc:format>
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">{e(title)}</rdf:li><rdf:li xml:lang="{lang}">{e(title)}</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>{e(author)}</rdf:li></rdf:Seq></dc:creator>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">{e(subject)}</rdf:li></rdf:Alt></dc:description>
   <dc:language><rdf:Bag><rdf:li>{lang}</rdf:li></rdf:Bag></dc:language>
   <pdf:Keywords>{e(keywords)}</pdf:Keywords>
   <xmp:CreateDate>{iso}</xmp:CreateDate>
   <xmp:ModifyDate>{iso}</xmp:ModifyDate>
   <xmp:MetadataDate>{iso}</xmp:MetadataDate>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>"""
    return body.encode("utf-8")


def finalize_pdf(src, dst, *, title: str, author: str, subject: str, keywords: str, created: dt.datetime, lang: str = "ja") -> dict:
    reader = PdfReader(str(src))
    writer = PdfWriter(clone_from=reader)

    # 文書情報: 作り直す（Chrome の Creator・Producer と、pypdf が入れる Producer を消す）
    d = pdf_date(created)
    writer.metadata = {"/Title": title, "/Author": author, "/Subject": subject, "/Keywords": keywords, "/CreationDate": d, "/ModDate": d}

    root = writer.root_object
    # XMP
    xmp = StreamObject()
    xmp.set_data(xmp_packet(title, author, subject, keywords, created, lang))
    xmp[NameObject("/Type")] = NameObject("/Metadata")
    xmp[NameObject("/Subtype")] = NameObject("/XML")
    root[NameObject("/Metadata")] = writer._add_object(xmp)  # noqa: SLF001
    # 表示: 題名をウィンドウに出す・言語
    vp = root.get("/ViewerPreferences")
    vp = vp.get_object() if vp is not None else DictionaryObject()
    vp[NameObject("/DisplayDocTitle")] = BooleanObject(True)
    root[NameObject("/ViewerPreferences")] = vp
    root[NameObject("/Lang")] = TextStringObject(lang)

    with open(dst, "wb") as f:
        writer.write(f)

    # 検査
    raw = open(dst, "rb").read()
    problems = []
    for key in FORBIDDEN_KEYS:
        if key in raw:
            problems.append(f"{key.decode()} があります")
    if raw.count(b"%%EOF") != 1:
        problems.append("%%EOF が1回ではありません（増分保存）")
    check = PdfReader(str(dst))
    meta = check.metadata or {}
    for k in ("/Creator", "/Producer"):
        if k in meta:
            problems.append(f"Info に {k} が残っています: {meta[k]}")
    hit = TOOL_WORDS.search(raw)
    if hit:
        problems.append(f"ツール名らしい語が残っています: {hit.group(0)!r}")
    for page in check.pages:
        for a in page.get("/Annots") or []:
            if a.get_object().get("/Subtype") != "/Link":
                problems.append("リンク以外の注釈があります")
    if problems:
        raise RuntimeError("PDF の後処理: " + " / ".join(problems))
    return {"bytes": len(raw), "title": meta.get("/Title"), "created": d}
