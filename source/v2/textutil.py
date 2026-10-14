# textutil.py - words from text
# Moved out of wordfreq.py in version 2, so other programs can use it.

import re

WORD = re.compile(r"[a-z']+")
STOP = {'the', 'a', 'an', 'and', 'of', 'to', 'in', 'is', 'it'}

def words_of(text, stop=False):
    # runs of letters (and apostrophes), in lower case
    ws = WORD.findall(text.lower())
    if stop:
        ws = [w for w in ws if w not in STOP]
    return ws

def read_words(path, stop=False):
    with open(path, encoding='utf-8') as f:
        return words_of(f.read(), stop)
