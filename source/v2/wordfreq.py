# wordfreq.py - count the words in a text file
# An example program for the bench template (invented; replace with your sources).
# Version 2: the reading moved to textutil.py; common words left out with -s; -n N for how many.

import sys
from collections import Counter

from textutil import read_words

def count(words):
    return Counter(words)

def main():
    args = sys.argv[1:]
    stop = '-s' in args
    n = 10
    if '-n' in args:
        n = int(args[args.index('-n') + 1])
    files = [a for a in args if not a.startswith('-') and not a.isdigit()]
    if not files:
        print('usage: wordfreq.py [-s] [-n N] FILE')
        return 1
    counts = count(read_words(files[0], stop))
    for w, c in counts.most_common(n):
        print(c, w)
    return 0

if __name__ == '__main__':
    sys.exit(main())
