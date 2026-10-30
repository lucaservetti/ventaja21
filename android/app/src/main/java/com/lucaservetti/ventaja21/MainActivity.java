package com.lucaservetti.ventaja21;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FontScalePlugin.class);
        super.onCreate(savedInstanceState);
        // El tamaño de letra del sistema no agranda el texto a ciegas (rompería el diseño):
        // la app lo lee con FontScalePlugin y activa su propio "Letra más grande".
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setTextZoom(100);
        }
    }
}
