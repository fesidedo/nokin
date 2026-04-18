import unittest

from nokin_lens_ingest.pipeline import parse_lens_cell, token_suffix


class IdPolicyTests(unittest.TestCase):
    def test_token_suffix_is_sorted_and_deduped(self) -> None:
        parsed = parse_lens_cell("24-70/2.8 G ED ED")
        self.assertEqual(parsed["variant_tokens"], ["ed", "g"])
        self.assertEqual(token_suffix(parsed["variant_tokens"]), "ed_g")

    def test_token_alias_and_case_normalization(self) -> None:
        parsed = parse_lens_cell("28/1.4 E eD")
        self.assertEqual(parsed["variant_tokens"], ["e", "ed"])
        self.assertEqual(token_suffix(parsed["variant_tokens"]), "e_ed")


if __name__ == "__main__":
    unittest.main()

