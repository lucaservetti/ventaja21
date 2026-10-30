package com.lucaservetti.ventaja21;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Devuelve el tamaño de letra que eligió la persona en los ajustes de Android (1.0 = normal).
@CapacitorPlugin(name = "FontScale")
public class FontScalePlugin extends Plugin {
    @PluginMethod
    public void get(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("scale", (double) getContext().getResources().getConfiguration().fontScale);
        call.resolve(ret);
    }
}
