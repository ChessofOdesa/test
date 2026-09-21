"""Stream a bounded sample of the official CC0 Lichess puzzle export.
Usage: python scripts/download-lichess-sample.py /path/to/sample.jsonl [rows=120000]
Requires the zstandard package. Does not download the entire export.
"""
import csv
import io
import json
import sys
import urllib.request
import zstandard

url = 'https://database.lichess.org/lichess_db_puzzle.csv.zst'
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 120000
with urllib.request.urlopen(url, timeout=45) as response:
    with zstandard.ZstdDecompressor().stream_reader(response) as stream:
        reader = csv.DictReader(io.TextIOWrapper(stream, encoding='utf-8'))
        with open(sys.argv[1], 'w', encoding='utf-8') as output:
            eligible = 0
            for index, row in enumerate(reader):
                if int(row['Popularity']) >= 80 and int(row['NbPlays']) >= 100 and int(row['RatingDeviation']) <= 100:
                    output.write(json.dumps(row) + '\n')
                    eligible += 1
                if index + 1 >= limit:
                    break
            print(json.dumps({'scanned': index + 1, 'eligible': eligible, 'source': url}))
