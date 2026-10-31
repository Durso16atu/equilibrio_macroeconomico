import os
import re
import unittest


class TestBasicoEconomiaProject(unittest.TestCase):
    """Testes automatizados de integridade estrutural e regras do simulador."""

    def setUp(self):
        self.root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.index_path = os.path.join(self.root, "index.html")
        self.engine_path = os.path.join(self.root, "src", "engine", "macro_physics.js")
        self.renderer_path = os.path.join(self.root, "src", "ui", "canvas_renderer.js")
        self.app_path = os.path.join(self.root, "src", "ui", "app.js")
        self.doc_path = os.path.join(self.root, "docs", "AULA_01_BASICAO_2_0.md")
        self.transcript_path = os.path.join(
            self.root, "docs", "transcricoes", "2026-10-30_basicao_2_0_intro.txt"
        )

    def test_project_files_exist(self):
        for path in [
            self.index_path,
            self.engine_path,
            self.renderer_path,
            self.app_path,
            self.doc_path,
            self.transcript_path,
        ]:
            self.assertTrue(os.path.isfile(path), f"Arquivo ausente: {path}")

    def test_two_scenario_blocks_present(self):
        with open(self.engine_path, encoding="utf-8") as f:
            content = f.read()
        atual_matches = re.findall(r'block:\s*"atual"', content)
        historico_matches = re.findall(r'block:\s*"historico"', content)
        self.assertGreaterEqual(len(atual_matches), 4, "Bloco 1 (atual) deve ter ao menos 4 fases")
        self.assertGreaterEqual(
            len(historico_matches), 4, "Bloco 2 (historico) deve ter ao menos 4 fases"
        )

    def test_reset_button_in_command_deck(self):
        with open(self.index_path, encoding="utf-8") as f:
            html = f.read()
        self.assertIn('id="btn-reset-sliders"', html)
        self.assertIn("AppController.resetCurrentScenarioSliders()", html)
        self.assertIn("Bloco 1: Momento Atual", html)
        self.assertIn("Bloco 2: Conhecimento Histórico", html)


if __name__ == "__main__":
    unittest.main()
