# wordfreq.py - count the words in a text file
# An example program for the bench template (invented; replace with your sources).

import sys

def read_words(path):
    # every run of letters is a word; case is ignored
    words = []
    with open(path) as f:
        for line in f:
            word = ''
            for ch in line.lower():
                if ch.isalpha():
                    word += ch
                elif word:
                    words.append(word)
                    word = ''
            if word:
                words.append(word)
    return words

def count(words):
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    return counts

def main():
    if len(sys.argv) < 2:
        print('usage: wordfreq.py FILE')
        return 1
    counts = count(read_words(sys.argv[1]))
    for w in sorted(counts, key=counts.get, reverse=True)[:10]:
        print(counts[w], w)
    return 0

if __name__ == '__main__':
    sys.exit(main())
