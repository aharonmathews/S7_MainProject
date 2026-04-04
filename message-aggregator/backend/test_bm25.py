import sys
sys.path.append('.')
from app.services.curation.improved_curator import improved_curator
from app.services.curation.advanced_curator import advanced_curator

def test_tokenization():
    messages = [
        {'content': "Don't forget the assignment, team!"},
        {'content': "Unrelated message about lunch."}
    ]
    prefs = ["assignment"]
    
    improved_scores = improved_curator._score_bm25(messages, prefs)
    advanced_scores = advanced_curator._score_bm25(messages, prefs)
    
    print("Improved BM25 Scores:", improved_scores)
    print("Advanced BM25 Scores:", advanced_scores)
    
    assert improved_scores[0] > improved_scores[1], "Improved curator BM25 tokenization failed to match 'assignment,' with 'assignment'"
    assert advanced_scores[0] > advanced_scores[1], "Advanced curator BM25 tokenization failed to match 'assignment,' with 'assignment'"
    print("✅ Tokenization fixes validated!")

if __name__ == '__main__':
    test_tokenization()
