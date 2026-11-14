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
        self.glossario_path = os.path.join(self.root, "glossario.html")
        self.transcript_path = os.path.join(
            self.root, "docs", "transcricoes", "2026-10-30_basicao_2_0_intro.txt"
        )
        self.transcript_monetaria_path = os.path.join(
            self.root, "docs", "transcricoes", "2026-11-06_basicao_politica_monetaria.txt"
        )
        self.transcript_cambio_path = os.path.join(
            self.root, "docs", "transcricoes", "2026-11-12_cambio_e_juros_kupfer.txt"
        )
        self.transcript_pia_path = os.path.join(
            self.root, "docs", "transcricoes", "2026-11-13_basicao_juros_divida_ajuste.txt"
        )

    def test_project_files_exist(self):
        for path in [
            self.index_path,
            self.glossario_path,
            self.engine_path,
            self.renderer_path,
            self.app_path,
            self.doc_path,
            self.transcript_path,
            self.transcript_monetaria_path,
            self.transcript_cambio_path,
            self.transcript_pia_path,
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
        self.assertIn("51,6%", content)
        self.assertIn("swaps", content)
        self.assertIn("lftShare", content)

    def test_reset_button_in_command_deck(self):
        with open(self.index_path, encoding="utf-8") as f:
            html = f.read()
        self.assertIn('id="btn-reset-sliders"', html)
        self.assertIn("AppController.resetCurrentScenarioSliders()", html)
        self.assertIn("Bloco 1: Momento Atual", html)
        self.assertIn("Bloco 2: Conhecimento Histórico", html)
        self.assertIn('href="glossario.html"', html)

    def test_glossario_seven_sources_and_canvas_layers(self):
        with open(self.glossario_path, encoding="utf-8") as f:
            glossario = f.read()
        self.assertIn("cambio-e-juros-com-jose-paulo-kupfer", glossario)
        self.assertIn("jaccuse-a-proposal-to-eliminate-brazils", glossario)
        self.assertIn("basicao-juros-divida-ajusteo-que", glossario)

        with open(self.renderer_path, encoding="utf-8") as f:
            renderer = f.read()
        self.assertIn("1. TANQUE DA DÍVIDA / PIB", renderer)
        self.assertIn("LFT Pós:", renderer)

    def test_consultant_homologated_index_and_strict_scope(self):
        import json
        import sys

        if self.root not in sys.path:
            sys.path.insert(0, self.root)
        from src.ai.consultant_cli import answer_query

        index_json = os.path.join(self.root, "src", "data", "knowledge_index.json")
        index_js = os.path.join(self.root, "src", "data", "knowledge_index.js")
        consultant_ui = os.path.join(self.root, "src", "ui", "chat_consultant.js")

        self.assertTrue(os.path.isfile(index_json))
        self.assertTrue(os.path.isfile(index_js))
        self.assertTrue(os.path.isfile(consultant_ui))

        with open(index_json, encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["metadata"]["total_official_sources"], 7)
        self.assertGreaterEqual(data["metadata"]["total_transcript_chunks"], 300)

        # Pergunta dentro do escopo homologado (LFTs 51,6%)
        res_in = answer_query("Por que os 51,6% de LFTs geram expansão endógena no Tanque?", api_key="")
        self.assertTrue(res_in.dentro_do_escopo)
        self.assertIn("51,6%", res_in.resposta_engenharia)
        self.assertGreaterEqual(len(res_in.citacoes), 1)
        self.assertEqual(res_in.citacoes[0].fonte_id, "Fonte #7")

        # Pergunta fora do escopo homologado deve ser recusada estritamente
        res_out = answer_query("Qual a receita de bolo de chocolate e o placar do jogo?", api_key="")
        self.assertFalse(res_out.dentro_do_escopo)
        self.assertEqual(len(res_out.citacoes), 0)


if __name__ == "__main__":
    unittest.main()
