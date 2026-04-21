import unittest

from nokin_lens_ingest.pipeline import (
    derive_has_aperture_ring_estimate,
    derive_sensor_format,
)


class SensorAndRingPolicyTests(unittest.TestCase):
    def test_sensor_format_prefers_explicit_type_markers(self) -> None:
        self.assertEqual(
            derive_sensor_format(
                type_norm="z-dx",
                type_raw="Z DX",
                lens_raw="16-50/3.5-6.3 VR",
                variant_tokens=["vr"],
                feature_tokens=[],
                source_row_refs=[{"source_section": "Z Zoom"}],
            ),
            "dx",
        )

        self.assertEqual(
            derive_sensor_format(
                type_norm="z",
                type_raw="Z",
                lens_raw="24-70/4 S",
                variant_tokens=["s"],
                feature_tokens=[],
                source_row_refs=[{"source_section": "Z Zoom"}],
            ),
            "fx",
        )

    def test_sensor_format_falls_back_to_feature_or_lens_tokens(self) -> None:
        self.assertEqual(
            derive_sensor_format(
                type_norm="af-s",
                type_raw="AF-S",
                lens_raw="18-55/3.5-5.6 DX",
                variant_tokens=[],
                feature_tokens=[],
                source_row_refs=[{"source_section": "AF-S Zoom"}],
            ),
            "dx",
        )
        self.assertEqual(
            derive_sensor_format(
                type_norm="af",
                type_raw="AF",
                lens_raw="28-80/3.5-5.6",
                variant_tokens=[],
                feature_tokens=["dx"],
                source_row_refs=[{"source_section": "AF Zoom"}],
            ),
            "dx",
        )

    def test_ring_policy_for_af(self) -> None:
        self.assertTrue(
            derive_has_aperture_ring_estimate(
                type_norm="af",
                sensor_format="fx",
                variant_tokens=[],
            )
        )
        self.assertFalse(
            derive_has_aperture_ring_estimate(
                type_norm="af",
                sensor_format="dx",
                variant_tokens=[],
            )
        )

    def test_ring_policy_for_af_s(self) -> None:
        self.assertTrue(
            derive_has_aperture_ring_estimate(
                type_norm="af-s",
                sensor_format="fx",
                variant_tokens=[],
            )
        )
        self.assertFalse(
            derive_has_aperture_ring_estimate(
                type_norm="af-s",
                sensor_format="dx",
                variant_tokens=[],
            )
        )
        self.assertFalse(
            derive_has_aperture_ring_estimate(
                type_norm="af-s",
                sensor_format="fx",
                variant_tokens=["g"],
            )
        )
        self.assertFalse(
            derive_has_aperture_ring_estimate(
                type_norm="af-s",
                sensor_format="fx",
                variant_tokens=["e", "vr"],
            )
        )

    def test_ring_policy_for_z_family(self) -> None:
        self.assertFalse(
            derive_has_aperture_ring_estimate(
                type_norm="z",
                sensor_format="fx",
                variant_tokens=[],
            )
        )
        self.assertFalse(
            derive_has_aperture_ring_estimate(
                type_norm="z-dx",
                sensor_format="dx",
                variant_tokens=[],
            )
        )


if __name__ == "__main__":
    unittest.main()
