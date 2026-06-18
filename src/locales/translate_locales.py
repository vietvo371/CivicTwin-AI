import json
import os
import re
import time
import sys
import urllib.parse
import requests

def flatten_json(y):
    out = {}
    def flatten(x, name=''):
        if type(x) is dict:
            for a in x:
                flatten(x[a], name + a + '.')
        elif type(x) is list:
            i = 0
            for a in x:
                flatten(a, name + str(i) + '.')
                i += 1
        else:
            out[name[:-1]] = x
    flatten(y)
    return out

def unflatten_json(d):
    result = {}
    for key, value in d.items():
        parts = key.split('.')
        d_curr = result
        for part in parts[:-1]:
            if part not in d_curr:
                d_curr[part] = {}
            d_curr = d_curr[part]
        d_curr[parts[-1]] = value
    return result

def is_translatable(text):
    if not isinstance(text, str):
        return False
    if not text.strip():
        return False
    # Must contain at least one alphabetic character
    if not any(c.isalpha() for c in text):
        return False
    return True

def translate_individual(text, target_lang, source_lang='en'):
    if not is_translatable(text):
        return text
        
    placeholders = re.findall(r'\{[a-zA-Z0-9_]+\}', text)
    temp_text = text
    for idx, p in enumerate(placeholders):
        temp_text = temp_text.replace(p, f" __VAR_{idx}__ ")

    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl={target_lang}&dt=t&q={urllib.parse.quote(temp_text)}"
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            res = r.json()
            parts = res[0]
            translated = "".join([part[0] for part in parts if part and part[0]])
            for idx, p in enumerate(placeholders):
                translated = re.sub(rf'\s*__\s*VAR_{idx}\s*__\s*', p, translated)
            return translated
    except Exception:
        pass
    return text

def translate_batch(texts, target_lang, source_lang='en'):
    if not texts:
        return []
        
    # Protect placeholders inside each text
    processed_texts = []
    placeholders_list = []
    for text in texts:
        placeholders = re.findall(r'\{[a-zA-Z0-9_]+\}', text)
        temp_text = text
        for idx, p in enumerate(placeholders):
            temp_text = temp_text.replace(p, f" __VAR_{idx}__ ")
        processed_texts.append(temp_text)
        placeholders_list.append(placeholders)
        
    # Join with newlines
    joined_text = "\n".join(processed_texts)
    
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl={target_lang}&dt=t&q={urllib.parse.quote(joined_text)}"
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            res = r.json()
            parts = res[0]
            translated_joined = "".join([part[0] for part in parts if part and part[0]])
            
            # Split back by newlines
            translated_lines = [line.strip() for line in translated_joined.split("\n")]
            # Remove trailing empty strings if any
            translated_lines = [l for l in translated_lines if l != ""]
            
            if len(translated_lines) == len(texts):
                final_translations = []
                for idx, line in enumerate(translated_lines):
                    placeholders = placeholders_list[idx]
                    trans_text = line
                    for p_idx, p in enumerate(placeholders):
                        trans_text = re.sub(rf'\s*__\s*VAR_{p_idx}\s*__\s*', p, trans_text)
                    final_translations.append(trans_text)
                return final_translations
            else:
                print(f"[{target_lang}] Line count mismatch (got {len(translated_lines)}, expected {len(texts)}). Falling back to individual translation.")
        else:
            print(f"[{target_lang}] Error {r.status_code} in batch translation. Falling back.")
    except Exception as e:
        print(f"[{target_lang}] Exception in batch: {e}. Falling back.")
        
    # Fallback: Translate one-by-one
    fallback_translations = []
    for text in texts:
        fallback_translations.append(translate_individual(text, target_lang, source_lang))
        time.sleep(0.05)
    return fallback_translations

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    en_path = os.path.join(script_dir, "en.json")
    
    if not os.path.exists(en_path):
        print(f"Error: en.json not found at {en_path}")
        return

    with open(en_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)
        
    flat_en = flatten_json(en_data)
    keys = list(flat_en.keys())
    
    languages = {
        "th": "Thai",
        "id": "Indonesian",
        "ms": "Malay",
        "tl": "Tagalog",
        "km": "Khmer",
        "lo": "Lao",
        "my": "Myanmar (Burmese)"
    }
    
    print(f"Starting newline-joined batch translation for 7 languages with {len(keys)} keys...")
    
    for lang_code, lang_name in languages.items():
        dest_path = os.path.join(script_dir, f"{lang_code}.json")
        if os.path.exists(dest_path):
            print(f"[{lang_code}] file already exists. Skipping.")
            continue
            
        print(f"\n[{lang_code}] Translating to {lang_name}...")
        
        translated_flat = {}
        cache = {} # cache for identical strings
        
        # We process keys in batches of 40 translatable strings
        translatable_batch_keys = []
        translatable_batch_vals = []
        
        batch_size = 40
        processed_count = 0
        
        for idx, k in enumerate(keys):
            val = flat_en[k]
            if not isinstance(val, str):
                translated_flat[k] = val
                processed_count += 1
                continue
                
            if not is_translatable(val):
                translated_flat[k] = val
                processed_count += 1
                continue
                
            if val in cache:
                translated_flat[k] = cache[val]
                processed_count += 1
                continue
                
            # Queue for batch translation
            translatable_batch_keys.append(k)
            translatable_batch_vals.append(val)
            
            if len(translatable_batch_vals) >= batch_size or (idx + 1) == len(keys):
                # Translate current batch
                translations = translate_batch(translatable_batch_vals, lang_code)
                for b_idx, b_k in enumerate(translatable_batch_keys):
                    orig_val = translatable_batch_vals[b_idx]
                    trans_val = translations[b_idx]
                    translated_flat[b_k] = trans_val
                    cache[orig_val] = trans_val # cache it
                    processed_count += 1
                    
                print(f"[{lang_code}] Progress: {processed_count}/{len(keys)} keys processed")
                translatable_batch_keys = []
                translatable_batch_vals = []
                time.sleep(0.3) # delay between batch calls to prevent rate limits
                
        # Flush any remaining queued keys
        if translatable_batch_vals:
            translations = translate_batch(translatable_batch_vals, lang_code)
            for b_idx, b_k in enumerate(translatable_batch_keys):
                orig_val = translatable_batch_vals[b_idx]
                trans_val = translations[b_idx]
                translated_flat[b_k] = trans_val
                cache[orig_val] = trans_val
                processed_count += 1
            print(f"[{lang_code}] Progress: {processed_count}/{len(keys)} keys processed")
            
        translated_json = unflatten_json(translated_flat)
        with open(dest_path, "w", encoding="utf-8") as f_out:
            json.dump(translated_json, f_out, ensure_ascii=False, indent=2)
        print(f"[{lang_code}] Completed and saved to {dest_path}!")
        time.sleep(1.0)
        
    print("\nAll translations completed successfully!")

if __name__ == "__main__":
    main()
