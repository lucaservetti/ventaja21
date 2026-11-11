#!/usr/bin/env python3
"""Pasa los textos en español de rioplatense (vos) a español neutro (tú).

Uso: python3 scripts/neutro.py [--revisar]
  Sin opciones, cambia los archivos. Con --revisar, solo lista lo que todavía suena a "vos".

Cambia los textos de la app, las lecciones, la web, las guías, los textos legales y las pruebas.
En src/i18n/en.json cambia solo las claves (el texto en español), así las traducciones al
inglés siguen encontrándose. No toca la lista de insultos del filtro de apodos.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LETRA = "A-Za-zÁÉÍÓÚÑáéíóúñü"

# Frases que necesitan contexto (van antes que las palabras sueltas).
FRASES = [
    # Pasado en primera persona que no hay que tocar.
    ("Subí a ${", "\u0000SUBI\u0000"), ("Subí a {0}", "\u0000SUBI0\u0000"),
    # "Rendir" un examen es rioplatense.
    ("rendí el examen", "haz el examen"), ("Rendí el examen", "Haz el examen"),
    ("rendí el nivel", "haz el nivel"), ("Rendí el nivel", "Haz el nivel"),
    ("rendí un examen", "haz un examen"), ("Rendí un examen", "Haz un examen"),
    ("rendir el examen", "hacer el examen"), ("rendir el nivel", "hacer el nivel"),
    # Plata → dinero (cambia el género).
    ("toda la plata", "todo el dinero"), ("Toda la plata", "Todo el dinero"),
    ("la misma plata", "el mismo dinero"), ("misma plata", "mismo dinero"),
    ("cuánta plata", "cuánto dinero"), ("Cuánta plata", "Cuánto dinero"),
    ("poca plata", "poco dinero"), ("mucha plata", "mucho dinero"),
    ("esa plata", "ese dinero"), ("Esa plata", "Ese dinero"),
    ("la plata", "el dinero"), ("La plata", "El dinero"),
    # Vos como pronombre.
    ("con vos", "contigo"), ("Con vos", "Contigo"),
    ("para vos", "para ti"), ("a vos", "a ti"), ("de vos", "de ti"),
    # Charla de la mesa.
    ("Dale, dale, que viene el As.", "¡Vamos, vamos, que viene el As!"),
    # Recién (en el sentido rioplatense).
    ("Si recién empezás", "Si apenas empiezas"), ("si recién empezás", "si apenas empiezas"),
    ("recién empezás", "apenas empiezas"), ("pero recién salió", "pero apenas salió"),
    ("Recién dejás", "Solo dejas"), ("recién conviene", "solo conviene"),
    ("recién con", "solo con"), ("Se toma recién", "Se toma solo"),
    # Andate (irse) e "Instalar en la compu".
    ("agradecé y andate tranquilo", "agradece y retírate tranquilo"),
    ("agradecé y andate", "agradece y retírate"),
    ("en la compu", "en la computadora"), ("en una compu", "en una computadora"),
    ("Compu (instalada)", "Computadora (instalada)"), ("Compu (navegador)", "Computadora (navegador)"),
    ('"iPhone" o "compu"', '"iPhone" o "computadora"'),
    ("si te trabás", "si te atascas"), ("Si te trabás", "Si te atascas"),
]

# Palabra por palabra (en minúscula; se respetan mayúsculas).
PALABRAS = {
    # Presente.
    "abandonás": "abandonas", "aceptás": "aceptas", "acertás": "aciertas", "acordás": "acuerdas",
    "ahorrás": "ahorras", "anotás": "anotas", "apagás": "apagas", "aparecés": "apareces",
    "apostás": "apuestas", "aprendés": "aprendes", "aprobás": "apruebas", "arrancás": "empiezas",
    "arriesgás": "arriesgas", "borrás": "borras", "buscás": "buscas", "calculás": "calculas",
    "cambiás": "cambias", "cancelás": "cancelas", "cerrás": "cierras", "cobrás": "cobras",
    "cometés": "cometes", "compartís": "compartes", "contestás": "contestas", "contás": "cuentas",
    "creés": "crees", "decidís": "decides", "decís": "dices", "dejás": "dejas",
    "desafiás": "desafías", "dividís": "divides", "doblás": "doblas", "dominás": "dominas",
    "duplicás": "duplicas", "elegís": "eliges", "empatás": "empatas", "empezás": "empiezas",
    "encontrás": "encuentras", "entregás": "entregas", "entrenás": "entrenas", "entrás": "entras",
    "equivocás": "equivocas", "escribís": "escribes", "fallás": "fallas", "ganás": "ganas",
    "guardás": "guardas", "hacés": "haces", "interactuás": "interactúas", "jugás": "juegas",
    "levantás": "levantas", "llegás": "llegas", "llevás": "llevas", "mantenés": "mantienes",
    "mirás": "miras", "movés": "mueves", "necesitás": "necesitas", "pagás": "pagas",
    "parecés": "pareces", "pasás": "pasas", "pedís": "pides", "pensás": "piensas",
    "perdés": "pierdes", "plantás": "plantas", "podés": "puedes", "ponés": "pones",
    "practicás": "practicas", "prendés": "prendes", "probás": "pruebas", "quedás": "quedas",
    "querés": "quieres", "recibís": "recibes", "recuperás": "recuperas", "redondeás": "redondeas",
    "reinstalás": "reinstalas", "rendís": "rindes", "repasás": "repasas", "repetís": "repites",
    "respondés": "respondes", "retirás": "retiras", "sabés": "sabes", "sacás": "sacas",
    "salvás": "salvas", "seguís": "sigues", "sentás": "sientas", "sentís": "sientes",
    "separás": "separas", "subís": "subes", "sumás": "sumas", "tenés": "tienes",
    "terminás": "terminas", "tocás": "tocas", "tomás": "tomas", "trabás": "atascas",
    "usás": "usas", "variás": "varías", "venís": "vienes", "vivís": "vives", "volvés": "vuelves",
    "sos": "eres",
    # Imperativo.
    "abrí": "abre", "acertá": "acierta", "actualizá": "actualiza", "agradecé": "agradece",
    "aguantá": "aguanta", "ajustá": "ajusta", "anotá": "anota", "aparecé": "aparece",
    "aplicá": "aplica", "apostá": "apuesta", "aprendé": "aprende", "aprobá": "aprueba",
    "arrancá": "empieza", "arriesgá": "arriesga", "bajá": "baja", "borrá": "borra",
    "buscá": "busca", "calculá": "calcula", "cambiá": "cambia", "cancelá": "cancela",
    "compartí": "comparte", "compará": "compara", "competí": "compite", "completá": "completa",
    "confirmá": "confirma", "construí": "construye", "contestá": "contesta", "contá": "cuenta",
    "copiá": "copia", "corregí": "corrige", "cuidá": "cuida", "decidí": "decide", "decí": "di",
    "dejá": "deja", "desafiá": "desafía", "desinstalá": "desinstala", "dividí": "divide",
    "doblá": "dobla", "elegí": "elige", "empezá": "empieza", "encendé": "enciende",
    "encontrá": "encuentra", "entendé": "entiende", "entrená": "entrena", "entrá": "entra",
    "escribí": "escribe", "evitá": "evita", "frená": "frena", "ganá": "gana", "guardá": "guarda",
    "hacé": "haz", "instalá": "instala", "invitá": "invita", "jugá": "juega", "leé": "lee",
    "llevá": "lleva", "mantené": "mantén", "memorizá": "memoriza", "mirá": "mira", "mové": "mueve",
    "pará": "para", "pasá": "pasa", "pedí": "pide", "pegá": "pega", "pensá": "piensa",
    "poné": "pon", "practicá": "practica", "prendé": "prende", "probá": "prueba",
    "recibí": "recibe", "recordá": "recuerda", "redondeá": "redondea", "repartí": "reparte",
    "repasá": "repasa", "repetí": "repite", "restá": "resta", "revisá": "revisa",
    "salteá": "salta", "saltá": "salta", "salvá": "salva", "seguí": "sigue",
    "seleccioná": "selecciona", "separá": "separa", "simulá": "simula", "subí": "sube",
    "sumá": "suma", "tené": "ten", "terminá": "termina", "tocá": "toca", "tomá": "toma",
    "usá": "usa", "variá": "varía", "volvé": "vuelve",
    # Imperativo con pronombre.
    "actualizala": "actualízala", "apagalo": "apágalo", "aprendelas": "apréndelas",
    "cambiala": "cámbiala", "cambialo": "cámbialo", "comparalo": "compáralo",
    "comportate": "compórtate", "contalas": "cuéntalas", "copialo": "cópialo", "decilo": "dilo",
    "dejalas": "déjalas", "dejalo": "déjalo", "dividilo": "divídelo", "doblalo": "dóblalo",
    "enterate": "entérate", "escribinos": "escríbenos", "fijate": "fíjate", "ganalo": "gánalo",
    "ganate": "gánate", "guardalo": "guárdalo", "hacelo": "hazlo", "jugala": "juégala",
    "jugalo": "juégalo", "jugalos": "juégalos", "leela": "léela", "leelo": "léelo",
    "llamalos": "llámalos", "mirala": "mírala", "miralo": "míralo", "pasalo": "pásalo",
    "pasate": "pásate", "pegalo": "pégalo", "plantate": "plántate", "ponelo": "ponlo",
    "ponete": "ponte", "practicalo": "practícalo", "practicalos": "practícalos",
    "probala": "pruébala", "probalo": "pruébalo", "quedate": "quédate", "rendite": "ríndete",
    "repartilas": "repártelas", "repasalas": "repásalas", "respetalo": "respétalo",
    "retirate": "retírate", "seguinos": "síguenos", "separalos": "sepáralos", "subilo": "súbelo",
    "tenela": "tenla", "tomalo": "tómalo", "tomate": "tómate", "usalo": "úsalo",
    "andate": "vete",
    # Regionalismos.
    "plata": "dinero", "acá": "aquí", "vos": "tú",
}


def con_mayusculas(original, nuevo):
    if original.isupper() and len(original) > 1:
        return nuevo.upper()
    if original[0].isupper():
        return nuevo[0].upper() + nuevo[1:]
    return nuevo


PATRON = re.compile(
    rf"(?<![{LETRA}])(" + "|".join(sorted(map(re.escape, PALABRAS), key=len, reverse=True)) + rf")(?![{LETRA}])",
    re.IGNORECASE,
)


def neutro(texto):
    for a, b in FRASES:
        texto = texto.replace(a, b)
    texto = PATRON.sub(lambda m: con_mayusculas(m.group(0), PALABRAS[m.group(0).lower()]), texto)
    return texto.replace("\u0000SUBI\u0000", "Subí a ${").replace("\u0000SUBI0\u0000", "Subí a {0}")


def archivos():
    lista = []
    for patron in ["src/**/*.js", "src/**/*.jsx", "tools/guias/*.mjs", "tests/**/*.mjs", "tests/**/*.js"]:
        lista += RAIZ.glob(patron)
    lista += [RAIZ / f for f in ["index.html", "terminos.html", "privacidad.html", "borrar-cuenta.html", "store/ficha.md", "servidor/index.js"]]
    fuera = {"src/nombres-filtro.js", "src/i18n/en.json"}
    return [p for p in lista if p.is_file() and str(p.relative_to(RAIZ)) not in fuera]


def claves_en():
    """Cambia solo las claves de en.json (línea por línea, sin reformatear)."""
    p = RAIZ / "src/i18n/en.json"
    vistas = set()
    salida = []
    for linea in p.read_text(encoding="utf8").split("\n"):
        m = re.match(r'^("(?:[^"\\]|\\.)*")(: .*)$', linea)
        if not m:
            salida.append(linea)
            continue
        clave = neutro(m.group(1))
        if clave in vistas:  # dos claves quedaron iguales: queda la primera
            continue
        vistas.add(clave)
        salida.append(clave + m.group(2))
    texto = "\n".join(salida)
    texto = re.sub(r",(\s*\n\})", r"\1", texto)  # por si se fue la última clave
    json.loads(texto)
    p.write_text(texto, encoding="utf8")


def revisar():
    sospechosas = re.compile(rf"(?<![{LETRA}])([{LETRA}]+(?:ás|és|ís)|vos|sos|plata|acá)(?![{LETRA}])")
    permitidas = {"más", "atrás", "demás", "jamás", "quizás", "además", "después", "inglés", "través",
                  "interés", "país", "estrés", "revés", "estás", "francés", "japonés", "portugués"}
    for p in archivos():
        for n, linea in enumerate(p.read_text(encoding="utf8").split("\n"), 1):
            for m in sospechosas.finditer(linea):
                if m.group(1).lower() not in permitidas:
                    print(f"{p.relative_to(RAIZ)}:{n}: {m.group(1)}  ·  {linea.strip()[:90]}")


if __name__ == "__main__":
    if "--revisar" in sys.argv:
        revisar()
        sys.exit()
    cambiados = 0
    for p in archivos():
        viejo = p.read_text(encoding="utf8")
        nuevo = neutro(viejo)
        if nuevo != viejo:
            p.write_text(nuevo, encoding="utf8")
            cambiados += 1
    claves_en()
    print(f"{cambiados} archivos cambiados, y las claves de en.json")
