"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Il2Cpp;
(function (Il2Cpp) {
    /** */
    Il2Cpp.application = {
        /**
         * Gets the data path name of the current application, e.g.
         * `/data/emulated/0/Android/data/com.example.application/files`
         * on Android.
         *
         * **This information is not guaranteed to exist.**
         *
         * ```ts
         * Il2Cpp.perform(() => {
         *     console.log(Il2Cpp.application.dataPath);
         * });
         * ```
         */
        get dataPath() {
            return unityEngineCall("get_persistentDataPath");
        },

        get identifier() {
            return unityEngineCall("get_identifier") ?? unityEngineCall("get_bundleIdentifier") ?? Process.mainModule.name;
        },

        get version() {
            return unityEngineCall("get_version") ?? exportsHash(Il2Cpp.module).toString(16);
        }
    };

    getter(Il2Cpp, "unityVersion", () => {
        try {
            const unityVersion = Il2Cpp.$config.unityVersion ?? unityEngineCall("get_unityVersion");
            if (unityVersion != null) {
                return unityVersion;
            }
        }
        catch (_) {
        }
        const searchPattern = "69 6c 32 63 70 70";
        for (const range of Il2Cpp.module.enumerateRanges("r--").concat(Process.getRangeByAddress(Il2Cpp.module.base))) {
            for (let { address } of Memory.scanSync(range.base, range.size, searchPattern)) {
                while (address.readU8() != 0) {
                    address = address.sub(1);
                }
                const match = UnityVersion.find(address.add(1).readCString());
                if (match != undefined) {
                    return match;
                }
            }
        }
        raise("couldn't determine the Unity version, please specify it manually");
    }, lazy);

    getter(Il2Cpp, "unityVersionIsBelow201830", () => {
        return UnityVersion.lt(Il2Cpp.unityVersion, "2018.3.0");
    }, lazy);

    getter(Il2Cpp, "unityVersionIsBelow202120", () => {
        return UnityVersion.lt(Il2Cpp.unityVersion, "2021.2.0");
    }, lazy);
    function unityEngineCall(method) {
        const handle = Il2Cpp.exports.resolveInternalCall(Memory.allocUtf8String("UnityEngine.Application::" + method));
        const nativeFunction = new NativeFunction(handle, "pointer", []);
        return nativeFunction.isNull() ? null : new Il2Cpp.String(nativeFunction()).asNullable()?.content ?? null;
    }
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {

    function boxed(value, type) {
        const mapping = {
            int8: "System.SByte",
            uint8: "System.Byte",
            int16: "System.Int16",
            uint16: "System.UInt16",
            int32: "System.Int32",
            uint32: "System.UInt32",
            int64: "System.Int64",
            uint64: "System.UInt64",
            char: "System.Char",
            intptr: "System.IntPtr",
            uintptr: "System.UIntPtr"
        };
        const className = typeof value == "boolean"
            ? "System.Boolean"
            : typeof value == "number"
                ? mapping[type ?? "int32"]
                : value instanceof Int64
                    ? "System.Int64"
                    : value instanceof UInt64
                        ? "System.UInt64"
                        : value instanceof NativePointer
                            ? mapping[type ?? "intptr"]
                            : raise(`Cannot create boxed primitive using value of type '${typeof value}'`);
        const object = Il2Cpp.corlib.class(className ?? raise(`Unknown primitive type name '${type}'`)).alloc();
        (object.tryField("m_value") ?? object.tryField("_pointer") ?? raise(`Could not find primitive field in class '${className}'`)).value = value;
        return object;
    }
    Il2Cpp.boxed = boxed;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    /**
     * Set of configurations users can override. It is for advanced use cases,
     * when certain values cannot be detected automatically. \
     * For reference, see:
     * - {@link Il2Cpp.module};
     * - {@link Il2Cpp.unityVersion};
     * - {@link Il2Cpp.exports};
     */
    Il2Cpp.$config = {
        moduleName: undefined,
        unityVersion: undefined,
        exports: {
	il2cpp_init: () => Il2Cpp.module.findExportByName("ITAtHOcJERU"),
	il2cpp_init_utf16: () => Il2Cpp.module.findExportByName("BlSILClfTep"),
	il2cpp_shutdown: () => Il2Cpp.module.findExportByName("jCVEUrxpedn"),
	il2cpp_set_config_dir: () => Il2Cpp.module.findExportByName("JryofZSebey"),
	il2cpp_set_data_dir: () => Il2Cpp.module.findExportByName("cgaouadRzLD"),
	il2cpp_set_temp_dir: () => Il2Cpp.module.findExportByName("HdRIGbVLnGY"),
	il2cpp_set_commandline_arguments: () => Il2Cpp.module.findExportByName("saQPIPNVdZU"),
	il2cpp_set_commandline_arguments_utf16: () => Il2Cpp.module.findExportByName("XvXKfb_yQaZ"),
	il2cpp_set_config_utf16: () => Il2Cpp.module.findExportByName("j_LI_KVfkVR"),
	il2cpp_set_config: () => Il2Cpp.module.findExportByName("zJjLhNYNYiI"),
	il2cpp_set_memory_callbacks: () => Il2Cpp.module.findExportByName("hEJfNbmJJxm"),
	il2cpp_memory_pool_set_region_size: () => Il2Cpp.module.findExportByName("ayTpxtziFgv"),
	il2cpp_memory_pool_get_region_size: () => Il2Cpp.module.findExportByName("XBJCaQzTRzd"),
	il2cpp_get_corlib: () => Il2Cpp.module.findExportByName("W_EZfNinobw"),
	il2cpp_add_internal_call: () => Il2Cpp.module.findExportByName("zqFIKBCzVXG"),
	il2cpp_resolve_icall: () => Il2Cpp.module.findExportByName("VDohxPcfmOo"),
	il2cpp_alloc: () => Il2Cpp.module.findExportByName("nbgkwNMFMWS"),
	il2cpp_free: () => Il2Cpp.module.findExportByName("NKdwYSJKuWa"),
	il2cpp_array_class_get: () => Il2Cpp.module.findExportByName("uGAKdfVXUYF"),
	il2cpp_array_length: () => Il2Cpp.module.findExportByName("zkLVaBozXmK"),
	il2cpp_array_get_byte_length: () => Il2Cpp.module.findExportByName("EzrhlBEPUnt"),
	il2cpp_array_new: () => Il2Cpp.module.findExportByName("uyODkVCPbB_"),
	il2cpp_array_new_specific: () => Il2Cpp.module.findExportByName("DzDXafEZdYY"),
	il2cpp_array_new_full: () => Il2Cpp.module.findExportByName("vXjAPzjdlRx"),
	il2cpp_bounded_array_class_get: () => Il2Cpp.module.findExportByName("AV_RyTzfUjq"),
	il2cpp_array_element_size: () => Il2Cpp.module.findExportByName("KHIS_rBpjOx"),
	il2cpp_assembly_get_image: () => Il2Cpp.module.findExportByName("jSgUUtKmzjJ"),
	il2cpp_class_for_each: () => Il2Cpp.module.findExportByName("qTaypczsgNu"),
	il2cpp_class_enum_basetype: () => Il2Cpp.module.findExportByName("xCrKFJVatRx"),
	il2cpp_class_is_inited: () => Il2Cpp.module.findExportByName("gohwXWMoVsP"),
	il2cpp_class_is_generic: () => Il2Cpp.module.findExportByName("YAnWWaaSyxY"),
	il2cpp_class_is_inflated: () => Il2Cpp.module.findExportByName("BsaDwKfCNUz"),
	il2cpp_class_is_assignable_from: () => Il2Cpp.module.findExportByName("YUSKnDCkyvb"),
	il2cpp_class_is_subclass_of: () => Il2Cpp.module.findExportByName("XzXAfzwGxpu"),
	il2cpp_class_has_parent: () => Il2Cpp.module.findExportByName("JyPTPPoncKG"),
	il2cpp_class_from_il2cpp_type: () => Il2Cpp.module.findExportByName("wNBNvEBtQlW"),
	il2cpp_class_from_name: () => Il2Cpp.module.findExportByName("FyvyMhNLRDJ"),
	il2cpp_class_from_system_type: () => Il2Cpp.module.findExportByName("nAMbSbUGKXf"),
	il2cpp_class_get_element_class: () => Il2Cpp.module.findExportByName("bXWTIbdsnKM"),
	il2cpp_class_get_events: () => Il2Cpp.module.findExportByName("BEcsOEyuyjx"),
	il2cpp_class_get_fields: () => Il2Cpp.module.findExportByName("ZiMTlEgMOse"),
	il2cpp_class_get_nested_types: () => Il2Cpp.module.findExportByName("tqxCIJuCNxS"),
	il2cpp_class_get_interfaces: () => Il2Cpp.module.findExportByName("bSipThwVkzk"),
	il2cpp_class_get_properties: () => Il2Cpp.module.findExportByName("pFBYzvaneKA"),
	il2cpp_class_get_property_from_name: () => Il2Cpp.module.findExportByName("hCSUmsEHcYJ"),
	il2cpp_class_get_field_from_name: () => Il2Cpp.module.findExportByName("JxphAhsacRP"),
	il2cpp_class_get_methods: () => Il2Cpp.module.findExportByName("rkYWCsMMSRJ"),
	il2cpp_class_get_method_from_name: () => Il2Cpp.module.findExportByName("KehkDYpuqtm"),
	il2cpp_class_get_name: () => Il2Cpp.module.findExportByName("BKyvutYOQWy"),
	il2cpp_type_get_name_chunked: () => Il2Cpp.module.findExportByName("WVd_wXShTtc"),
	il2cpp_class_get_namespace: () => Il2Cpp.module.findExportByName("jUIxtjpaEgZ"),
	il2cpp_class_get_parent: () => Il2Cpp.module.findExportByName("EpBIFuvgYkH"),
	il2cpp_class_get_declaring_type: () => Il2Cpp.module.findExportByName("blRcfaOEkdA"),
	il2cpp_class_instance_size: () => Il2Cpp.module.findExportByName("vGzmvsgxiLa"),
	il2cpp_class_num_fields: () => Il2Cpp.module.findExportByName("lZlznRxDwlE"),
	il2cpp_class_is_valuetype: () => Il2Cpp.module.findExportByName("_yg__YmkhDx"),
	il2cpp_class_value_size: () => Il2Cpp.module.findExportByName("PELMfsGlYBZ"),
	il2cpp_class_is_blittable: () => Il2Cpp.module.findExportByName("wsSMQyuNKUT"),
	il2cpp_class_get_flags: () => Il2Cpp.module.findExportByName("nZLTJNkZFfG"),
	il2cpp_class_is_abstract: () => Il2Cpp.module.findExportByName("niLRakrIsUc"),
	il2cpp_class_is_interface: () => Il2Cpp.module.findExportByName("pHHrkHlFFxT"),
	il2cpp_class_array_element_size: () => Il2Cpp.module.findExportByName("imPLRdorAxR"),
	il2cpp_class_from_type: () => Il2Cpp.module.findExportByName("DqxnMROBhFx"),
	il2cpp_class_get_type: () => Il2Cpp.module.findExportByName("NzhKMx_zMAJ"),
	il2cpp_class_get_type_token: () => Il2Cpp.module.findExportByName("HyxXnCDkecx"),
	il2cpp_class_has_attribute: () => Il2Cpp.module.findExportByName("JeSnHuExdXB"),
	il2cpp_class_has_references: () => Il2Cpp.module.findExportByName("EkalqYpjVcc"),
	il2cpp_class_is_enum: () => Il2Cpp.module.findExportByName("ZaZWOL_XAAG"),
	il2cpp_class_get_image: () => Il2Cpp.module.findExportByName("ULpdDBUoYyf"),
	il2cpp_class_get_assemblyname: () => Il2Cpp.module.findExportByName("CkeihoBVqsA"),
	il2cpp_class_get_rank: () => Il2Cpp.module.findExportByName("_pDSOzAxRxU"),
	il2cpp_class_get_data_size: () => Il2Cpp.module.findExportByName("MyS_hpoaRFP"),
	il2cpp_class_get_static_field_data: () => Il2Cpp.module.findExportByName("BTDPpKx_xsF"),
	il2cpp_stats_dump_to_file: () => Il2Cpp.module.findExportByName("xGrkIVbsYvQ"),
	il2cpp_stats_get_value: () => Il2Cpp.module.findExportByName("TNFyIMmnJYn"),
	il2cpp_domain_get: () => Il2Cpp.module.findExportByName("QXGKPSTsshv"),
	il2cpp_domain_assembly_open: () => Il2Cpp.module.findExportByName("CDpeHBKPTjI"),
	il2cpp_domain_get_assemblies: () => Il2Cpp.module.findExportByName("HvmuUYxcjJQ"),
	il2cpp_raise_exception: () => Il2Cpp.module.findExportByName("OpifnxBSIGQ"),
	il2cpp_exception_from_name_msg: () => Il2Cpp.module.findExportByName("zlpZvaBeFzF"),
	il2cpp_get_exception_argument_null: () => Il2Cpp.module.findExportByName("VRbZnnSLRxy"),
	il2cpp_format_exception: () => Il2Cpp.module.findExportByName("AUGxm_hdVby"),
	il2cpp_format_stack_trace: () => Il2Cpp.module.findExportByName("gTXVUdSQKbL"),
	il2cpp_unhandled_exception: () => Il2Cpp.module.findExportByName("BjOGxXDEyfb"),
	il2cpp_native_stack_trace: () => Il2Cpp.module.findExportByName("EEHjoOaDjxY"),
	il2cpp_field_get_flags: () => Il2Cpp.module.findExportByName("sPTtiWyVLvA"),
	il2cpp_field_get_from_reflection: () => Il2Cpp.module.findExportByName("KeLPjHSGaBe"),
	il2cpp_field_get_name: () => Il2Cpp.module.findExportByName("cFFMPsnQkYN"),
	il2cpp_field_get_parent: () => Il2Cpp.module.findExportByName("tTAKxvovSsn"),
	il2cpp_field_get_object: () => Il2Cpp.module.findExportByName("MRdaMwgCpuK"),
	il2cpp_field_get_offset: () => Il2Cpp.module.findExportByName("LHgbcouwEdH"),
	il2cpp_field_get_type: () => Il2Cpp.module.findExportByName("vTjLsZNYsgm"),
	il2cpp_field_get_value: () => Il2Cpp.module.findExportByName("WpIpaCLVtoX"),
	il2cpp_field_get_value_object: () => Il2Cpp.module.findExportByName("FmTZgtZLpcx"),
	il2cpp_field_has_attribute: () => Il2Cpp.module.findExportByName("BmRPqycjkIA"),
	il2cpp_field_set_value: () => Il2Cpp.module.findExportByName("hYFOwqDwWmw"),
	il2cpp_field_static_get_value: () => Il2Cpp.module.findExportByName("SKmtNUnQodL"),
	il2cpp_field_static_set_value: () => Il2Cpp.module.findExportByName("CDXcwprKcDQ"),
	il2cpp_field_set_value_object: () => Il2Cpp.module.findExportByName("ELfQKYxtWjA"),
	il2cpp_field_is_literal: () => Il2Cpp.module.findExportByName("kofUhyXWhsx"),
	il2cpp_gc_collect: () => Il2Cpp.module.findExportByName("rxMnIkmwwfr"),
	il2cpp_gc_collect_a_little: () => Il2Cpp.module.findExportByName("SwDfg_deZSI"),
	il2cpp_gc_start_incremental_collection: () => Il2Cpp.module.findExportByName("G_fzrBpwCAR"),
	il2cpp_gc_disable: () => Il2Cpp.module.findExportByName("wDInLGLkAey"),
	il2cpp_gc_enable: () => Il2Cpp.module.findExportByName("l_zrrZmryYB"),
	il2cpp_gc_is_disabled: () => Il2Cpp.module.findExportByName("YJSHDwxYChD"),
	il2cpp_gc_set_mode: () => Il2Cpp.module.findExportByName("EuiIVss_doF"),
	il2cpp_gc_get_max_time_slice_ns: () => Il2Cpp.module.findExportByName("cmIWAzRixkW"),
	il2cpp_gc_set_max_time_slice_ns: () => Il2Cpp.module.findExportByName("uztINxPKuvv"),
	il2cpp_gc_is_incremental: () => Il2Cpp.module.findExportByName("EThwCrxZBrf"),
	il2cpp_gc_get_used_size: () => Il2Cpp.module.findExportByName("EUxUI_FEuYV"),
	il2cpp_gc_get_heap_size: () => Il2Cpp.module.findExportByName("Jh__gmjiyRU"),
	il2cpp_gc_wbarrier_set_field: () => Il2Cpp.module.findExportByName("ZBkRwmxBszr"),
	il2cpp_gc_has_strict_wbarriers: () => Il2Cpp.module.findExportByName("iGsugrYeSiG"),
	il2cpp_gc_set_external_allocation_tracker: () => Il2Cpp.module.findExportByName("MlekwcLdkV_"),
	il2cpp_gc_set_external_wbarrier_tracker: () => Il2Cpp.module.findExportByName("KcJlGhmUlKj"),
	il2cpp_gc_foreach_heap: () => Il2Cpp.module.findExportByName("CpPYcguYHdT"),
	il2cpp_stop_gc_world: () => Il2Cpp.module.findExportByName("daGRpZwGJWi"),
	il2cpp_start_gc_world: () => Il2Cpp.module.findExportByName("bamnjNlEeUN"),
	il2cpp_gc_alloc_fixed: () => Il2Cpp.module.findExportByName("DvWJRvbEHSE"),
	il2cpp_gc_free_fixed: () => Il2Cpp.module.findExportByName("SqPTWHPOedy"),
	il2cpp_gchandle_new: () => Il2Cpp.module.findExportByName("XWHBgdaTbpZ"),
	il2cpp_gchandle_new_weakref: () => Il2Cpp.module.findExportByName("rLGufLFxvaK"),
	il2cpp_gchandle_get_target: () => Il2Cpp.module.findExportByName("nmuHCRJdURA"),
	il2cpp_gchandle_free: () => Il2Cpp.module.findExportByName("vhbSCe_tXHi"),
	il2cpp_gchandle_foreach_get_target: () => Il2Cpp.module.findExportByName("h_myBtxOvDN"),
	il2cpp_object_header_size: () => Il2Cpp.module.findExportByName("ZUdwTNNUuRH"),
	il2cpp_array_object_header_size: () => Il2Cpp.module.findExportByName("YmEHeZNSJMo"),
	il2cpp_offset_of_array_length_in_array_object_header: () => Il2Cpp.module.findExportByName("paWBeqlyuHj"),
	il2cpp_offset_of_array_bounds_in_array_object_header: () => Il2Cpp.module.findExportByName("kOUHuocCvJW"),
	il2cpp_allocation_granularity: () => Il2Cpp.module.findExportByName("R_FAxsUMiEw"),
	il2cpp_unity_liveness_allocate_struct: () => Il2Cpp.module.findExportByName("xGozcIPTgvq"),
	il2cpp_unity_liveness_calculation_from_root: () => Il2Cpp.module.findExportByName("jyztBfwKdVu"),
	il2cpp_unity_liveness_calculation_from_statics: () => Il2Cpp.module.findExportByName("mVdIOVxZehR"),
	il2cpp_unity_liveness_finalize: () => Il2Cpp.module.findExportByName("cD_AxP_DLxj"),
	il2cpp_unity_liveness_free_struct: () => Il2Cpp.module.findExportByName("YCaFJbsWOQL"),
	il2cpp_method_get_return_type: () => Il2Cpp.module.findExportByName("wNWoU_rKrWK"),
	il2cpp_method_get_declaring_type: () => Il2Cpp.module.findExportByName("JxdNRDLRSCZ"),
	il2cpp_method_get_name: () => Il2Cpp.module.findExportByName("ayDZwIpRwyB"),
	il2cpp_method_get_from_reflection: () => Il2Cpp.module.findExportByName("uzMqolwNNHg"),
	il2cpp_method_get_object: () => Il2Cpp.module.findExportByName("QJLdHBQonMo"),
	il2cpp_method_is_generic: () => Il2Cpp.module.findExportByName("McrI_RbkHcj"),
	il2cpp_method_is_inflated: () => Il2Cpp.module.findExportByName("PVjShiOvsxt"),
	il2cpp_method_is_instance: () => Il2Cpp.module.findExportByName("uXbnEwTdviU"),
	il2cpp_method_get_param_count: () => Il2Cpp.module.findExportByName("ZBshdAOKZYu"),
	il2cpp_method_get_param: () => Il2Cpp.module.findExportByName("neTyOIDNdQt"),
	il2cpp_method_get_class: () => Il2Cpp.module.findExportByName("uBl_utkxpVH"),
	il2cpp_method_has_attribute: () => Il2Cpp.module.findExportByName("gWAUjWoURJM"),
	il2cpp_method_get_flags: () => Il2Cpp.module.findExportByName("QtneASmrREC"),
	il2cpp_method_get_token: () => Il2Cpp.module.findExportByName("lgVrRBIYKqQ"),
	il2cpp_method_get_param_name: () => Il2Cpp.module.findExportByName("dFHZqoystRU"),
	il2cpp_property_get_flags: () => Il2Cpp.module.findExportByName("OJuYYtUNNGv"),
	il2cpp_property_get_get_method: () => Il2Cpp.module.findExportByName("Eg_ruGcFlCn"),
	il2cpp_property_get_set_method: () => Il2Cpp.module.findExportByName("FSwZUZsOjNE"),
	il2cpp_property_get_name: () => Il2Cpp.module.findExportByName("jtpOMctdvlh"),
	il2cpp_property_get_parent: () => Il2Cpp.module.findExportByName("hItzOVJNJkY"),
	il2cpp_object_get_class: () => Il2Cpp.module.findExportByName("ZjrdMEkmuJA"),
	il2cpp_object_get_size: () => Il2Cpp.module.findExportByName("VwFJVFspdOf"),
	il2cpp_object_get_virtual_method: () => Il2Cpp.module.findExportByName("fmuimZSfNxX"),
	il2cpp_object_new: () => Il2Cpp.module.findExportByName("ScVayGdXprz"),
	il2cpp_object_unbox: () => Il2Cpp.module.findExportByName("anLbQchRyPa"),
	il2cpp_value_box: () => Il2Cpp.module.findExportByName("IrRrDTFMtkv"),
	il2cpp_monitor_enter: () => Il2Cpp.module.findExportByName("lwoSVwUWIXX"),
	il2cpp_monitor_try_enter: () => Il2Cpp.module.findExportByName("ZZuGJzswWUL"),
	il2cpp_monitor_exit: () => Il2Cpp.module.findExportByName("GLGovyiNsre"),
	il2cpp_monitor_pulse: () => Il2Cpp.module.findExportByName("qpvHJVrwjle"),
	il2cpp_monitor_pulse_all: () => Il2Cpp.module.findExportByName("fkadyvVPmVs"),
	il2cpp_monitor_wait: () => Il2Cpp.module.findExportByName("spIC_FwfAON"),
	il2cpp_monitor_try_wait: () => Il2Cpp.module.findExportByName("OikhWlbtzjR"),
	il2cpp_runtime_invoke: () => Il2Cpp.module.findExportByName("SzNqsCMVqNX"),
	il2cpp_runtime_invoke_convert_args: () => Il2Cpp.module.findExportByName("XvgHXOcOilK"),
	il2cpp_runtime_class_init: () => Il2Cpp.module.findExportByName("StBVUcvptdh"),
	il2cpp_runtime_object_init: () => Il2Cpp.module.findExportByName("PNZXyaADrSE"),
	il2cpp_runtime_object_init_exception: () => Il2Cpp.module.findExportByName("DVKCCvtTKOd"),
	il2cpp_runtime_unhandled_exception_policy_set: () => Il2Cpp.module.findExportByName("YoeEYsRYUDm"),
	il2cpp_string_length: () => Il2Cpp.module.findExportByName("JMiFbyvMzDo"),
	il2cpp_string_chars: () => Il2Cpp.module.findExportByName("_JxuSxXJkxu"),
	il2cpp_string_new: () => Il2Cpp.module.findExportByName("OHHYrn_OLCw"),
	il2cpp_string_new_len: () => Il2Cpp.module.findExportByName("DaL_bTFWwLM"),
	il2cpp_string_new_utf16: () => Il2Cpp.module.findExportByName("NIsxj_nmDdi"),
	il2cpp_string_new_wrapper: () => Il2Cpp.module.findExportByName("Itm_zyYHBRf"),
	il2cpp_string_intern: () => Il2Cpp.module.findExportByName("ONirQBHHmjO"),
	il2cpp_string_is_interned: () => Il2Cpp.module.findExportByName("_Nguducyldj"),
	il2cpp_thread_current: () => Il2Cpp.module.findExportByName("brgaqnrsLjx"),
	il2cpp_thread_attach: () => Il2Cpp.module.findExportByName("XZkKiKosyHC"),
	il2cpp_thread_detach: () => Il2Cpp.module.findExportByName("HWyKlOeVHgV"),
	il2cpp_is_vm_thread: () => Il2Cpp.module.findExportByName("tOniezYQdLe"),
	il2cpp_current_thread_walk_frame_stack: () => Il2Cpp.module.findExportByName("VVkKMpWMRPm"),
	il2cpp_thread_walk_frame_stack: () => Il2Cpp.module.findExportByName("dwQnauFAnWw"),
	il2cpp_current_thread_get_top_frame: () => Il2Cpp.module.findExportByName("HaLYfKsToXA"),
	il2cpp_thread_get_top_frame: () => Il2Cpp.module.findExportByName("DFqEEXfVVgu"),
	il2cpp_current_thread_get_frame_at: () => Il2Cpp.module.findExportByName("VTAZaJamXif"),
	il2cpp_thread_get_frame_at: () => Il2Cpp.module.findExportByName("EPfxEBbbVva"),
	il2cpp_current_thread_get_stack_depth: () => Il2Cpp.module.findExportByName("AAurdoCYvce"),
	il2cpp_thread_get_stack_depth: () => Il2Cpp.module.findExportByName("TmpTUDznYUN"),
	il2cpp_override_stack_backtrace: () => Il2Cpp.module.findExportByName("MTngjclvBeM"),
	il2cpp_type_get_object: () => Il2Cpp.module.findExportByName("PFwXVWGeckf"),
	il2cpp_type_get_type: () => Il2Cpp.module.findExportByName("jDLSsrBahVH"),
	il2cpp_type_get_class_or_element_class: () => Il2Cpp.module.findExportByName("ZZhKRUWWOib"),
	il2cpp_type_get_name: () => Il2Cpp.module.findExportByName("VNwdSYN_Ac_"),
	il2cpp_type_is_byref: () => Il2Cpp.module.findExportByName("JACoGlJjCCC"),
	il2cpp_type_get_attrs: () => Il2Cpp.module.findExportByName("cvxuQAlmPys"),
	il2cpp_type_equals: () => Il2Cpp.module.findExportByName("ZQcDKobJMFm"),
	il2cpp_type_get_assembly_qualified_name: () => Il2Cpp.module.findExportByName("jsLiEGdBz_G"),
	il2cpp_type_get_reflection_name: () => Il2Cpp.module.findExportByName("krqMStJVxEC"),
	il2cpp_type_is_static: () => Il2Cpp.module.findExportByName("VyZMlTfANyg"),
	il2cpp_type_is_pointer_type: () => Il2Cpp.module.findExportByName("NJTtQPEmFPK"),
	il2cpp_image_get_assembly: () => Il2Cpp.module.findExportByName("cqfGzZtAbZi"),
	il2cpp_image_get_name: () => Il2Cpp.module.findExportByName("FZa_z_AueBS"),
	il2cpp_image_get_filename: () => Il2Cpp.module.findExportByName("oytwlOhdSXu"),
	il2cpp_image_get_entry_point: () => Il2Cpp.module.findExportByName("wXXCxtShaIZ"),
	il2cpp_image_get_class_count: () => Il2Cpp.module.findExportByName("FIGgipFzgMY"),
	il2cpp_image_get_class: () => Il2Cpp.module.findExportByName("NWWdAoXBDBY"),
	il2cpp_capture_memory_snapshot: () => Il2Cpp.module.findExportByName("IpzYwEzNyAK"),
	il2cpp_free_captured_memory_snapshot: () => Il2Cpp.module.findExportByName("lXeeYyqKDhC"),
	il2cpp_set_find_plugin_callback: () => Il2Cpp.module.findExportByName("pAkICKehGFC"),
	il2cpp_register_log_callback: () => Il2Cpp.module.findExportByName("gXEFLzgaVtv"),
	il2cpp_debugger_set_agent_options: () => Il2Cpp.module.findExportByName("yIpecOtGPCL"),
	il2cpp_is_debugger_attached: () => Il2Cpp.module.findExportByName("XtYfuqdCIbt"),
	il2cpp_register_debugger_agent_transport: () => Il2Cpp.module.findExportByName("DKCQIqXjPYD"),
	il2cpp_debug_foreach_method: () => Il2Cpp.module.findExportByName("dEXqxwPqxij"),
	il2cpp_debug_get_method_info: () => Il2Cpp.module.findExportByName("SmfSoPUDjlb"),
	il2cpp_unity_install_unitytls_interface: () => Il2Cpp.module.findExportByName("BMmxhoqLNeZ"),
	il2cpp_custom_attrs_from_class: () => Il2Cpp.module.findExportByName("qWXIOQxZSnI"),
	il2cpp_custom_attrs_from_method: () => Il2Cpp.module.findExportByName("k_kCMxiXNDK"),
	il2cpp_custom_attrs_from_field: () => Il2Cpp.module.findExportByName("O_nquqNBkem"),
	il2cpp_custom_attrs_get_attr: () => Il2Cpp.module.findExportByName("hkiBhXTKVPq"),
	il2cpp_custom_attrs_has_attr: () => Il2Cpp.module.findExportByName("pBrTnTuumkx"),
	il2cpp_custom_attrs_construct: () => Il2Cpp.module.findExportByName("ajXoRvRYfdX"),
	il2cpp_custom_attrs_free: () => Il2Cpp.module.findExportByName("fmIkkpoyoEW"),
	il2cpp_class_set_userdata: () => Il2Cpp.module.findExportByName("QNtCJwCnlQZ"),
	il2cpp_class_get_userdata_offset: () => Il2Cpp.module.findExportByName("HInTIGwaBVN"),
	il2cpp_set_default_thread_affinity: () => Il2Cpp.module.findExportByName("bQdgGOrZMaz"),
	il2cpp_unity_set_android_network_up_state_func: () => Il2Cpp.module.findExportByName("sYMiZ_dajKA"),
}
    };
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    /**
     * @deprecated
     * Dumps the application, i.e. it creates a dummy `.cs` file that contains
     * all the class, field and method declarations.
     *
     * The dump is very useful when it comes to inspecting the application as
     * you can easily search for succulent members using a simple text search,
     * hence this is typically the very first thing it should be done when
     * working with a new application. \
     * Keep in mind the dump is version, platform and arch dependentend, so
     * it has to be re-genereated if any of these changes.
     *
     * The file is generated in the **target** device, so you might need to
     * pull it to the host device afterwards.
     *
     * Dumping *may* require a file name and a directory path (a place where the
     * application can write to). If not provided, the target path is generated
     * automatically using the information from {@link Il2Cpp.application}.
     *
     * ```ts
     * Il2Cpp.perform(() => {
     *     Il2Cpp.dump();
     * });
     * ```
     *
     * For instance, the dump resembles the following:
     * ```
     * class Mono.DataConverter.PackContext : System.Object
     * {
     *     System.Byte[] buffer;
     *     System.Int32 next;
     *     System.String description;
     *     System.Int32 i;
     *     Mono.DataConverter conv;
     *     System.Int32 repeat;
     *     System.Int32 align;
     *
     *     System.Void Add(System.Byte[] group);
     *     System.Byte[] Get();
     *     System.Void .ctor();
     *   }
     * ```
     */
    function dump(fileName, path) {
        fileName = fileName ?? `${Il2Cpp.application.identifier}_${Il2Cpp.application.version}.cs`;
        path = path ?? Il2Cpp.application.dataPath ?? Process.getCurrentDir();
        createDirectoryRecursively(path);
        const destination = `${path}/${fileName}`;
        const file = new File(destination, "w");
        for (const assembly of Il2Cpp.domain.assemblies) {
            inform(`dumping ${assembly.name}...`);
            for (const klass of assembly.image.classes) {
                file.write(`${klass}\n\n`);
            }
        }
        file.flush();
        file.close();
        ok(`dump saved to ${destination}`);
        showDeprecationNotice();
    }
    Il2Cpp.dump = dump;

    function dumpTree(path, ignoreAlreadyExistingDirectory = false) {
        path = path ?? `${Il2Cpp.application.dataPath ?? Process.getCurrentDir()}/${Il2Cpp.application.identifier}_${Il2Cpp.application.version}`;
        if (!ignoreAlreadyExistingDirectory && directoryExists(path)) {
            raise(`directory ${path} already exists - pass ignoreAlreadyExistingDirectory = true to skip this check`);
        }
        for (const assembly of Il2Cpp.domain.assemblies) {
            inform(`dumping ${assembly.name}...`);
            const destination = `${path}/${assembly.name.replaceAll(".", "/")}.cs`;
            createDirectoryRecursively(destination.substring(0, destination.lastIndexOf("/")));
            const file = new File(destination, "w");
            for (const klass of assembly.image.classes) {
                file.write(`${klass}\n\n`);
            }
            file.flush();
            file.close();
        }
        ok(`dump saved to ${path}`);
        showDeprecationNotice();
    }
    Il2Cpp.dumpTree = dumpTree;
    function directoryExists(path) {
        return Il2Cpp.corlib.class("System.IO.Directory").method("Exists").invoke(Il2Cpp.string(path));
    }
    function createDirectoryRecursively(path) {
        Il2Cpp.corlib.class("System.IO.Directory").method("CreateDirectory").invoke(Il2Cpp.string(path));
    }
    function showDeprecationNotice() {
        warn("this api will be removed in a future release, please use `npx frida-il2cpp-bridge dump` instead");
    }
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {

    function installExceptionListener(targetThread = "current") {
        const currentThread = Il2Cpp.exports.threadGetCurrent();
        return Interceptor.attach(Il2Cpp.module.getExportByName("__cxa_throw"), function (args) {
            if (targetThread == "current" && !Il2Cpp.exports.threadGetCurrent().equals(currentThread)) {
                return;
            }
            inform(new Il2Cpp.Object(args[0].readPointer()));
        });
    }
    Il2Cpp.installExceptionListener = installExceptionListener;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {

    Il2Cpp.exports = {
        get alloc() {
            return r("il2cpp_alloc", "pointer", ["size_t"]);
        },
        get arrayGetLength() {
            return r("il2cpp_array_length", "uint32", ["pointer"]);
        },
        get arrayNew() {
            return r("il2cpp_array_new", "pointer", ["pointer", "uint32"]);
        },
        get assemblyGetImage() {
            return r("il2cpp_assembly_get_image", "pointer", ["pointer"]);
        },
        get classForEach() {
            return r("il2cpp_class_for_each", "void", ["pointer", "pointer"]);
        },
        get classFromName() {
            return r("il2cpp_class_from_name", "pointer", ["pointer", "pointer", "pointer"]);
        },
        get classFromObject() {
            return r("il2cpp_class_from_system_type", "pointer", ["pointer"]);
        },
        get classGetArrayClass() {
            return r("il2cpp_array_class_get", "pointer", ["pointer", "uint32"]);
        },
        get classGetArrayElementSize() {
            return r("il2cpp_class_array_element_size", "int", ["pointer"]);
        },
        get classGetAssemblyName() {
            return r("il2cpp_class_get_assemblyname", "pointer", ["pointer"]);
        },
        get classGetBaseType() {
            return r("il2cpp_class_enum_basetype", "pointer", ["pointer"]);
        },
        get classGetDeclaringType() {
            return r("il2cpp_class_get_declaring_type", "pointer", ["pointer"]);
        },
        get classGetElementClass() {
            return r("il2cpp_class_get_element_class", "pointer", ["pointer"]);
        },
        get classGetFieldFromName() {
            return r("il2cpp_class_get_field_from_name", "pointer", ["pointer", "pointer"]);
        },
        get classGetFields() {
            return r("il2cpp_class_get_fields", "pointer", ["pointer", "pointer"]);
        },
        get classGetFlags() {
            return r("il2cpp_class_get_flags", "int", ["pointer"]);
        },
        get classGetImage() {
            return r("il2cpp_class_get_image", "pointer", ["pointer"]);
        },
        get classGetInstanceSize() {
            return r("il2cpp_class_instance_size", "int32", ["pointer"]);
        },
        get classGetInterfaces() {
            return r("il2cpp_class_get_interfaces", "pointer", ["pointer", "pointer"]);
        },
        get classGetMethodFromName() {
            return r("il2cpp_class_get_method_from_name", "pointer", ["pointer", "pointer", "int"]);
        },
        get classGetMethods() {
            return r("il2cpp_class_get_methods", "pointer", ["pointer", "pointer"]);
        },
        get classGetName() {
            return r("il2cpp_class_get_name", "pointer", ["pointer"]);
        },
        get classGetNamespace() {
            return r("il2cpp_class_get_namespace", "pointer", ["pointer"]);
        },
        get classGetNestedClasses() {
            return r("il2cpp_class_get_nested_types", "pointer", ["pointer", "pointer"]);
        },
        get classGetParent() {
            return r("il2cpp_class_get_parent", "pointer", ["pointer"]);
        },
        get classGetStaticFieldData() {
            return r("il2cpp_class_get_static_field_data", "pointer", ["pointer"]);
        },
        get classGetValueTypeSize() {
            return r("il2cpp_class_value_size", "int32", ["pointer", "pointer"]);
        },
        get classGetType() {
            return r("il2cpp_class_get_type", "pointer", ["pointer"]);
        },
        get classHasReferences() {
            return r("il2cpp_class_has_references", "bool", ["pointer"]);
        },
        get classInitialize() {
            return r("il2cpp_runtime_class_init", "void", ["pointer"]);
        },
        get classIsAbstract() {
            return r("il2cpp_class_is_abstract", "bool", ["pointer"]);
        },
        get classIsAssignableFrom() {
            return r("il2cpp_class_is_assignable_from", "bool", ["pointer", "pointer"]);
        },
        get classIsBlittable() {
            return r("il2cpp_class_is_blittable", "bool", ["pointer"]);
        },
        get classIsEnum() {
            return r("il2cpp_class_is_enum", "bool", ["pointer"]);
        },
        get classIsGeneric() {
            return r("il2cpp_class_is_generic", "bool", ["pointer"]);
        },
        get classIsInflated() {
            return r("il2cpp_class_is_inflated", "bool", ["pointer"]);
        },
        get classIsInterface() {
            return r("il2cpp_class_is_interface", "bool", ["pointer"]);
        },
        get classIsSubclassOf() {
            return r("il2cpp_class_is_subclass_of", "bool", ["pointer", "pointer", "bool"]);
        },
        get classIsValueType() {
            return r("il2cpp_class_is_valuetype", "bool", ["pointer"]);
        },
        get domainGetAssemblyFromName() {
            return r("il2cpp_domain_assembly_open", "pointer", ["pointer", "pointer"]);
        },
        get domainGet() {
            return r("il2cpp_domain_get", "pointer", []);
        },
        get domainGetAssemblies() {
            return r("il2cpp_domain_get_assemblies", "pointer", ["pointer", "pointer"]);
        },
        get fieldGetClass() {
            return r("il2cpp_field_get_parent", "pointer", ["pointer"]);
        },
        get fieldGetFlags() {
            return r("il2cpp_field_get_flags", "int", ["pointer"]);
        },
        get fieldGetName() {
            return r("il2cpp_field_get_name", "pointer", ["pointer"]);
        },
        get fieldGetOffset() {
            return r("il2cpp_field_get_offset", "int32", ["pointer"]);
        },
        get fieldGetStaticValue() {
            return r("il2cpp_field_static_get_value", "void", ["pointer", "pointer"]);
        },
        get fieldGetType() {
            return r("il2cpp_field_get_type", "pointer", ["pointer"]);
        },
        get fieldSetStaticValue() {
            return r("il2cpp_field_static_set_value", "void", ["pointer", "pointer"]);
        },
        get free() {
            return r("il2cpp_free", "void", ["pointer"]);
        },
        get gcCollect() {
            return r("il2cpp_gc_collect", "void", ["int"]);
        },
        get gcCollectALittle() {
            return r("il2cpp_gc_collect_a_little", "void", []);
        },
        get gcDisable() {
            return r("il2cpp_gc_disable", "void", []);
        },
        get gcEnable() {
            return r("il2cpp_gc_enable", "void", []);
        },
        get gcGetHeapSize() {
            return r("il2cpp_gc_get_heap_size", "int64", []);
        },
        get gcGetMaxTimeSlice() {
            return r("il2cpp_gc_get_max_time_slice_ns", "int64", []);
        },
        get gcGetUsedSize() {
            return r("il2cpp_gc_get_used_size", "int64", []);
        },
        get gcHandleGetTarget() {
            return r("il2cpp_gchandle_get_target", "pointer", ["uint32"]);
        },
        get gcHandleFree() {
            return r("il2cpp_gchandle_free", "void", ["uint32"]);
        },
        get gcHandleNew() {
            return r("il2cpp_gchandle_new", "uint32", ["pointer", "bool"]);
        },
        get gcHandleNewWeakRef() {
            return r("il2cpp_gchandle_new_weakref", "uint32", ["pointer", "bool"]);
        },
        get gcIsDisabled() {
            return r("il2cpp_gc_is_disabled", "bool", []);
        },
        get gcIsIncremental() {
            return r("il2cpp_gc_is_incremental", "bool", []);
        },
        get gcSetMaxTimeSlice() {
            return r("il2cpp_gc_set_max_time_slice_ns", "void", ["int64"]);
        },
        get gcStartIncrementalCollection() {
            return r("il2cpp_gc_start_incremental_collection", "void", []);
        },
        get gcStartWorld() {
            return r("il2cpp_start_gc_world", "void", []);
        },
        get gcStopWorld() {
            return r("il2cpp_stop_gc_world", "void", []);
        },
        get getCorlib() {
            return r("il2cpp_get_corlib", "pointer", []);
        },
        get imageGetAssembly() {
            return r("il2cpp_image_get_assembly", "pointer", ["pointer"]);
        },
        get imageGetClass() {
            return r("il2cpp_image_get_class", "pointer", ["pointer", "uint"]);
        },
        get imageGetClassCount() {
            return r("il2cpp_image_get_class_count", "uint32", ["pointer"]);
        },
        get imageGetName() {
            return r("il2cpp_image_get_name", "pointer", ["pointer"]);
        },
        get initialize() {
            return r("il2cpp_init", "void", ["pointer"]);
        },
        get livenessAllocateStruct() {
            return r("il2cpp_unity_liveness_allocate_struct", "pointer", ["pointer", "int", "pointer", "pointer", "pointer"]);
        },
        get livenessCalculationBegin() {
            return r("il2cpp_unity_liveness_calculation_begin", "pointer", ["pointer", "int", "pointer", "pointer", "pointer", "pointer"]);
        },
        get livenessCalculationEnd() {
            return r("il2cpp_unity_liveness_calculation_end", "void", ["pointer"]);
        },
        get livenessCalculationFromStatics() {
            return r("il2cpp_unity_liveness_calculation_from_statics", "void", ["pointer"]);
        },
        get livenessFinalize() {
            return r("il2cpp_unity_liveness_finalize", "void", ["pointer"]);
        },
        get livenessFreeStruct() {
            return r("il2cpp_unity_liveness_free_struct", "void", ["pointer"]);
        },
        get memorySnapshotCapture() {
            return r("il2cpp_capture_memory_snapshot", "pointer", []);
        },
        get memorySnapshotFree() {
            return r("il2cpp_free_captured_memory_snapshot", "void", ["pointer"]);
        },
        get memorySnapshotGetClasses() {
            return r("il2cpp_memory_snapshot_get_classes", "pointer", ["pointer", "pointer"]);
        },
        get memorySnapshotGetObjects() {
            return r("il2cpp_memory_snapshot_get_objects", "pointer", ["pointer", "pointer"]);
        },
        get methodGetClass() {
            return r("il2cpp_method_get_class", "pointer", ["pointer"]);
        },
        get methodGetFlags() {
            return r("il2cpp_method_get_flags", "uint32", ["pointer", "pointer"]);
        },
        get methodGetName() {
            return r("il2cpp_method_get_name", "pointer", ["pointer"]);
        },
        get methodGetObject() {
            return r("il2cpp_method_get_object", "pointer", ["pointer", "pointer"]);
        },
        get methodGetParameterCount() {
            return r("il2cpp_method_get_param_count", "uint8", ["pointer"]);
        },
        get methodGetParameterName() {
            return r("il2cpp_method_get_param_name", "pointer", ["pointer", "uint32"]);
        },
        get methodGetParameters() {
            return r("il2cpp_method_get_parameters", "pointer", ["pointer", "pointer"]);
        },
        get methodGetParameterType() {
            return r("il2cpp_method_get_param", "pointer", ["pointer", "uint32"]);
        },
        get methodGetReturnType() {
            return r("il2cpp_method_get_return_type", "pointer", ["pointer"]);
        },
        get methodIsGeneric() {
            return r("il2cpp_method_is_generic", "bool", ["pointer"]);
        },
        get methodIsInflated() {
            return r("il2cpp_method_is_inflated", "bool", ["pointer"]);
        },
        get methodIsInstance() {
            return r("il2cpp_method_is_instance", "bool", ["pointer"]);
        },
        get monitorEnter() {
            return r("il2cpp_monitor_enter", "void", ["pointer"]);
        },
        get monitorExit() {
            return r("il2cpp_monitor_exit", "void", ["pointer"]);
        },
        get monitorPulse() {
            return r("il2cpp_monitor_pulse", "void", ["pointer"]);
        },
        get monitorPulseAll() {
            return r("il2cpp_monitor_pulse_all", "void", ["pointer"]);
        },
        get monitorTryEnter() {
            return r("il2cpp_monitor_try_enter", "bool", ["pointer", "uint32"]);
        },
        get monitorTryWait() {
            return r("il2cpp_monitor_try_wait", "bool", ["pointer", "uint32"]);
        },
        get monitorWait() {
            return r("il2cpp_monitor_wait", "void", ["pointer"]);
        },
        get objectGetClass() {
            return r("il2cpp_object_get_class", "pointer", ["pointer"]);
        },
        get objectGetVirtualMethod() {
            return r("il2cpp_object_get_virtual_method", "pointer", ["pointer", "pointer"]);
        },
        get objectInitialize() {
            return r("il2cpp_runtime_object_init_exception", "void", ["pointer", "pointer"]);
        },
        get objectNew() {
            return r("il2cpp_object_new", "pointer", ["pointer"]);
        },
        get objectGetSize() {
            return r("il2cpp_object_get_size", "uint32", ["pointer"]);
        },
        get objectUnbox() {
            return r("il2cpp_object_unbox", "pointer", ["pointer"]);
        },
        get resolveInternalCall() {
            return r("il2cpp_resolve_icall", "pointer", ["pointer"]);
        },
        get stringGetChars() {
            return r("il2cpp_string_chars", "pointer", ["pointer"]);
        },
        get stringGetLength() {
            return r("il2cpp_string_length", "int32", ["pointer"]);
        },
        get stringNew() {
            return r("il2cpp_string_new", "pointer", ["pointer"]);
        },
        get valueTypeBox() {
            return r("il2cpp_value_box", "pointer", ["pointer", "pointer"]);
        },
        get threadAttach() {
            return r("il2cpp_thread_attach", "pointer", ["pointer"]);
        },
        get threadDetach() {
            return r("il2cpp_thread_detach", "void", ["pointer"]);
        },
        get threadGetAttachedThreads() {
            return r("il2cpp_thread_get_all_attached_threads", "pointer", ["pointer"]);
        },
        get threadGetCurrent() {
            return r("il2cpp_thread_current", "pointer", []);
        },
        get threadIsVm() {
            return r("il2cpp_is_vm_thread", "bool", ["pointer"]);
        },
        get typeEquals() {
            return r("il2cpp_type_equals", "bool", ["pointer", "pointer"]);
        },
        get typeGetClass() {
            return r("il2cpp_class_from_type", "pointer", ["pointer"]);
        },
        get typeGetName() {
            return r("il2cpp_type_get_name", "pointer", ["pointer"]);
        },
        get typeGetObject() {
            return r("il2cpp_type_get_object", "pointer", ["pointer"]);
        },
        get typeGetTypeEnum() {
            return r("il2cpp_type_get_type", "int", ["pointer"]);
        }
    };
    decorate(Il2Cpp.exports, lazy);
    getter(Il2Cpp, "memorySnapshotExports", () => new CModule("#include <stdint.h>\n#include <string.h>\n\ntypedef struct Il2CppManagedMemorySnapshot Il2CppManagedMemorySnapshot;\ntypedef struct Il2CppMetadataType Il2CppMetadataType;\n\nstruct Il2CppManagedMemorySnapshot\n{\n  struct Il2CppManagedHeap\n  {\n    uint32_t section_count;\n    void * sections;\n  } heap;\n  struct Il2CppStacks\n  {\n    uint32_t stack_count;\n    void * stacks;\n  } stacks;\n  struct Il2CppMetadataSnapshot\n  {\n    uint32_t type_count;\n    Il2CppMetadataType * types;\n  } metadata_snapshot;\n  struct Il2CppGCHandles\n  {\n    uint32_t tracked_object_count;\n    void ** pointers_to_objects;\n  } gc_handles;\n  struct Il2CppRuntimeInformation\n  {\n    uint32_t pointer_size;\n    uint32_t object_header_size;\n    uint32_t array_header_size;\n    uint32_t array_bounds_offset_in_header;\n    uint32_t array_size_offset_in_header;\n    uint32_t allocation_granularity;\n  } runtime_information;\n  void * additional_user_information;\n};\n\nstruct Il2CppMetadataType\n{\n  uint32_t flags;\n  void * fields;\n  uint32_t field_count;\n  uint32_t statics_size;\n  uint8_t * statics;\n  uint32_t base_or_element_type_index;\n  char * name;\n  const char * assembly_name;\n  uint64_t type_info_address;\n  uint32_t size;\n};\n\nuintptr_t\nil2cpp_memory_snapshot_get_classes (\n    const Il2CppManagedMemorySnapshot * snapshot, Il2CppMetadataType ** iter)\n{\n  const int zero = 0;\n  const void * null = 0;\n\n  if (iter != NULL && snapshot->metadata_snapshot.type_count > zero)\n  {\n    if (*iter == null)\n    {\n      *iter = snapshot->metadata_snapshot.types;\n      return (uintptr_t) (*iter)->type_info_address;\n    }\n    else\n    {\n      Il2CppMetadataType * metadata_type = *iter + 1;\n\n      if (metadata_type < snapshot->metadata_snapshot.types +\n                              snapshot->metadata_snapshot.type_count)\n      {\n        *iter = metadata_type;\n        return (uintptr_t) (*iter)->type_info_address;\n      }\n    }\n  }\n  return 0;\n}\n\nvoid **\nil2cpp_memory_snapshot_get_objects (\n    const Il2CppManagedMemorySnapshot * snapshot, uint32_t * size)\n{\n  *size = snapshot->gc_handles.tracked_object_count;\n  return snapshot->gc_handles.pointers_to_objects;\n}\n"), lazy);
    function r(exportName, retType, argTypes) {
        const handle = Il2Cpp.$config.exports?.[exportName]?.() ?? Il2Cpp.module.findExportByName(exportName) ?? Il2Cpp.memorySnapshotExports[exportName];
        const target = new NativeFunction(handle ?? NULL, retType, argTypes);
        return target.isNull()
            ? new Proxy(target, {
                get(value, name) {
                    const property = value[name];
                    return typeof property === "function" ? property.bind(value) : property;
                },
                apply() {
                    if (handle == null) {
                        raise(`couldn't resolve export ${exportName}`);
                    }
                    else if (handle.isNull()) {
                        raise(`export ${exportName} points to NULL IL2CPP library has likely been stripped, obfuscated, or customized`);
                    }
                }
            })
            : target;
    }
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {

    function is(klass) {
        return (element) => {
            if (element instanceof Il2Cpp.Class) {
                return klass.isAssignableFrom(element);
            }
            else {
                return klass.isAssignableFrom(element.class);
            }
        };
    }
    Il2Cpp.is = is;

    function isExactly(klass) {
        return (element) => {
            if (element instanceof Il2Cpp.Class) {
                return element.equals(klass);
            }
            else {
                return element.class.equals(klass);
            }
        };
    }
    Il2Cpp.isExactly = isExactly;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {

    Il2Cpp.gc = {

        get heapSize() {
            return Il2Cpp.exports.gcGetHeapSize();
        },

        get isEnabled() {
            return !Il2Cpp.exports.gcIsDisabled();
        },

        get isIncremental() {
            return !!Il2Cpp.exports.gcIsIncremental();
        },

        get maxTimeSlice() {
            return Il2Cpp.exports.gcGetMaxTimeSlice();
        },

        get usedHeapSize() {
            return Il2Cpp.exports.gcGetUsedSize();
        },

        set isEnabled(value) {
            value ? Il2Cpp.exports.gcEnable() : Il2Cpp.exports.gcDisable();
        },

        set maxTimeSlice(nanoseconds) {
            Il2Cpp.exports.gcSetMaxTimeSlice(nanoseconds);
        },

        choose(klass) {
            const matches = [];
            const callback = (objects, size) => {
                for (let i = 0; i < size; i++) {
                    matches.push(new Il2Cpp.Object(objects.add(i * Process.pointerSize).readPointer()));
                }
            };
            const chooseCallback = new NativeCallback(callback, "void", ["pointer", "int", "pointer"]);
            if (Il2Cpp.unityVersionIsBelow202120) {
                const onWorld = new NativeCallback(() => { }, "void", []);
                const state = Il2Cpp.exports.livenessCalculationBegin(klass, 0, chooseCallback, NULL, onWorld, onWorld);
                Il2Cpp.exports.livenessCalculationFromStatics(state);
                Il2Cpp.exports.livenessCalculationEnd(state);
            }
            else {
                const realloc = (handle, size) => {
                    if (!handle.isNull() && size.compare(0) == 0) {
                        Il2Cpp.free(handle);
                        return NULL;
                    }
                    else {
                        return Il2Cpp.alloc(size);
                    }
                };
                const reallocCallback = new NativeCallback(realloc, "pointer", ["pointer", "size_t", "pointer"]);
                this.stopWorld();
                const state = Il2Cpp.exports.livenessAllocateStruct(klass, 0, chooseCallback, NULL, reallocCallback);
                Il2Cpp.exports.livenessCalculationFromStatics(state);
                Il2Cpp.exports.livenessFinalize(state);
                this.startWorld();
                Il2Cpp.exports.livenessFreeStruct(state);
            }
            return matches;
        },

        collect(generation) {
            Il2Cpp.exports.gcCollect(generation < 0 ? 0 : generation > 2 ? 2 : generation);
        },

        collectALittle() {
            Il2Cpp.exports.gcCollectALittle();
        },

        startWorld() {
            return Il2Cpp.exports.gcStartWorld();
        },

        startIncrementalCollection() {
            return Il2Cpp.exports.gcStartIncrementalCollection();
        },

        stopWorld() {
            return Il2Cpp.exports.gcStopWorld();
        }
    };
})(Il2Cpp || (Il2Cpp = {}));

var Android;
(function (Android) {

    getter(Android, "apiLevel", () => {
        const value = getProperty("ro.build.version.sdk");
        return value ? parseInt(value) : null;
    }, lazy);
    function getProperty(name) {
        const handle = Process.findModuleByName("libc.so")?.findExportByName("__system_property_get");
        if (handle) {
            const __system_property_get = new NativeFunction(handle, "void", ["pointer", "pointer"]);
            const value = Memory.alloc(92).writePointer(NULL);
            __system_property_get(Memory.allocUtf8String(name), value);
            return value.readCString() ?? undefined;
        }
    }
})(Android || (Android = {}));

function raise(message) {
    const error = new Error(message);

    error.name = "Il2CppError";
    error.stack = error.stack

        ?.replace(/^(Il2Cpp)?Error/, "\x1b[0m\x1b[38;5;9mil2cpp\x1b[0m")


        ?.replace(/\n    at (.+) \((.+):(.+)\)/, "\x1b[3m\x1b[2m")

        ?.concat("\x1B[0m");
    throw error;
}

function warn(message) {
    globalThis.console.log(`\x1b[38;5;11mil2cpp\x1b[0m: ${message}`);
}

function ok(message) {
    globalThis.console.log(`\x1b[38;5;10mil2cpp\x1b[0m: ${message}`);
}

function inform(message) {
    globalThis.console.log(`\x1b[38;5;12mil2cpp\x1b[0m: ${message}`);
}

function decorate(target, decorator, descriptors = Object.getOwnPropertyDescriptors(target)) {
    for (const key in descriptors) {
        descriptors[key] = decorator(target, key, descriptors[key]);
    }
    Object.defineProperties(target, descriptors);
    return target;
}

function getter(target, key, get, decorator) {
    globalThis.Object.defineProperty(target, key, decorator?.(target, key, { get, configurable: true }) ?? { get, configurable: true });
}

function cyrb53(str) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function exportsHash(module) {
    return cyrb53(module
        .enumerateExports()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(_ => _.name + _.address.sub(module.base))
        .join(""));
}

function lazy(_, propertyKey, descriptor) {
    const getter = descriptor.get;
    if (!getter) {
        throw new Error("@lazy can only be applied to getter accessors");
    }
    descriptor.get = function () {
        const value = getter.call(this);
        Object.defineProperty(this, propertyKey, {
            value,
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            writable: false
        });
        return value;
    };
    return descriptor;
}

var NativeStruct = (typeof NativeStruct !== 'undefined') ? NativeStruct : class NativeStruct {
    handle;
    constructor(handleOrWrapper) {
        if (handleOrWrapper instanceof NativePointer) {
            this.handle = handleOrWrapper;
        }
        else {
            this.handle = handleOrWrapper.handle;
        }
    }
    equals(other) {
        return this.handle.equals(other.handle);
    }
    isNull() {
        return this.handle.isNull();
    }
    asNullable() {
        return this.isNull() ? null : this;
    }
};

function addFlippedEntries(obj) {
    return Object.keys(obj).reduce((obj, key) => ((obj[obj[key]] = key), obj), obj);
}
NativePointer.prototype.offsetOf = function (condition, depth) {
    depth ??= 512;
    for (let i = 0; depth > 0 ? i < depth : i < -depth; i++) {
        if (condition(depth > 0 ? this.add(i) : this.sub(i))) {
            return i;
        }
    }
    return null;
};

function readNativeIterator(block) {
    const array = [];
    const iterator = Memory.alloc(Process.pointerSize);
    let handle = block(iterator);
    while (!handle.isNull()) {
        array.push(handle);
        handle = block(iterator);
    }
    return array;
}

function readNativeList(block) {
    const lengthPointer = Memory.alloc(Process.pointerSize);
    const startPointer = block(lengthPointer);
    if (startPointer.isNull()) {
        return [];
    }
    const array = new Array(lengthPointer.readInt());
    for (let i = 0; i < array.length; i++) {
        array[i] = startPointer.add(i * Process.pointerSize).readPointer();
    }
    return array;
}

function recycle(Class) {
    return new Proxy(Class, {
        cache: new Map(),
        construct(Target, argArray) {
            const handle = argArray[0].toUInt32();
            if (!this.cache.has(handle)) {
                this.cache.set(handle, new Target(argArray[0]));
            }
            return this.cache.get(handle);
        }
    });
}

var UnityVersion;
(function (UnityVersion) {
    const pattern = /(6\d{3}|20\d{2}|\d)\.(\d)\.(\d{1,2})(?:[abcfp]|rc){0,2}\d?/;
    function find(string) {
        return string?.match(pattern)?.[0];
    }
    UnityVersion.find = find;
    function gte(a, b) {
        return compare(a, b) >= 0;
    }
    UnityVersion.gte = gte;
    function lt(a, b) {
        return compare(a, b) < 0;
    }
    UnityVersion.lt = lt;
    function compare(a, b) {
        const aMatches = a.match(pattern);
        const bMatches = b.match(pattern);
        for (let i = 1; i <= 3; i++) {
            const a = Number(aMatches?.[i] ?? -1);
            const b = Number(bMatches?.[i] ?? -1);
            if (a > b)
                return 1;
            else if (a < b)
                return -1;
        }
        return 0;
    }
})(UnityVersion || (UnityVersion = {}));
var Il2Cpp;
(function (Il2Cpp) {

    function alloc(size = Process.pointerSize) {
        return Il2Cpp.exports.alloc(size);
    }
    Il2Cpp.alloc = alloc;

    function free(pointer) {
        return Il2Cpp.exports.free(pointer);
    }
    Il2Cpp.free = free;

    function read(pointer, type) {
        switch (type.enumValue) {
            case Il2Cpp.Type.Enum.BOOLEAN:
                return !!pointer.readS8();
            case Il2Cpp.Type.Enum.BYTE:
                return pointer.readS8();
            case Il2Cpp.Type.Enum.UBYTE:
                return pointer.readU8();
            case Il2Cpp.Type.Enum.SHORT:
                return pointer.readS16();
            case Il2Cpp.Type.Enum.USHORT:
                return pointer.readU16();
            case Il2Cpp.Type.Enum.INT:
                return pointer.readS32();
            case Il2Cpp.Type.Enum.UINT:
                return pointer.readU32();
            case Il2Cpp.Type.Enum.CHAR:
                return pointer.readU16();
            case Il2Cpp.Type.Enum.LONG:
                return pointer.readS64();
            case Il2Cpp.Type.Enum.ULONG:
                return pointer.readU64();
            case Il2Cpp.Type.Enum.FLOAT:
                return pointer.readFloat();
            case Il2Cpp.Type.Enum.DOUBLE:
                return pointer.readDouble();
            case Il2Cpp.Type.Enum.NINT:
            case Il2Cpp.Type.Enum.NUINT:
                return pointer.readPointer();
            case Il2Cpp.Type.Enum.POINTER:
                return new Il2Cpp.Pointer(pointer.readPointer(), type.class.baseType);
            case Il2Cpp.Type.Enum.VALUE_TYPE:
                return new Il2Cpp.ValueType(pointer, type);
            case Il2Cpp.Type.Enum.OBJECT:
            case Il2Cpp.Type.Enum.CLASS:
                return new Il2Cpp.Object(pointer.readPointer());
            case Il2Cpp.Type.Enum.GENERIC_INSTANCE:
                return type.class.isValueType ? new Il2Cpp.ValueType(pointer, type) : new Il2Cpp.Object(pointer.readPointer());
            case Il2Cpp.Type.Enum.STRING:
                return new Il2Cpp.String(pointer.readPointer());
            case Il2Cpp.Type.Enum.ARRAY:
            case Il2Cpp.Type.Enum.NARRAY:
                return new Il2Cpp.Array(pointer.readPointer());
        }
        raise(`couldn't read the value from ${pointer} using an unhandled or unknown type ${type.name} (${type.enumValue}), please file an issue`);
    }
    Il2Cpp.read = read;

    function write(pointer, value, type) {
        switch (type.enumValue) {
            case Il2Cpp.Type.Enum.BOOLEAN:
                return pointer.writeS8(+value);
            case Il2Cpp.Type.Enum.BYTE:
                return pointer.writeS8(value);
            case Il2Cpp.Type.Enum.UBYTE:
                return pointer.writeU8(value);
            case Il2Cpp.Type.Enum.SHORT:
                return pointer.writeS16(value);
            case Il2Cpp.Type.Enum.USHORT:
                return pointer.writeU16(value);
            case Il2Cpp.Type.Enum.INT:
                return pointer.writeS32(value);
            case Il2Cpp.Type.Enum.UINT:
                return pointer.writeU32(value);
            case Il2Cpp.Type.Enum.CHAR:
                return pointer.writeU16(value);
            case Il2Cpp.Type.Enum.LONG:
                return pointer.writeS64(value);
            case Il2Cpp.Type.Enum.ULONG:
                return pointer.writeU64(value);
            case Il2Cpp.Type.Enum.FLOAT:
                return pointer.writeFloat(value);
            case Il2Cpp.Type.Enum.DOUBLE:
                return pointer.writeDouble(value);
            case Il2Cpp.Type.Enum.NINT:
            case Il2Cpp.Type.Enum.NUINT:
            case Il2Cpp.Type.Enum.POINTER:
            case Il2Cpp.Type.Enum.STRING:
            case Il2Cpp.Type.Enum.ARRAY:
            case Il2Cpp.Type.Enum.NARRAY:
                return pointer.writePointer(value);
            case Il2Cpp.Type.Enum.VALUE_TYPE:
                return Memory.copy(pointer, value, type.class.valueTypeSize), pointer;
            case Il2Cpp.Type.Enum.OBJECT:
            case Il2Cpp.Type.Enum.CLASS:
            case Il2Cpp.Type.Enum.GENERIC_INSTANCE:
                return value instanceof Il2Cpp.ValueType ? (Memory.copy(pointer, value, type.class.valueTypeSize), pointer) : pointer.writePointer(value);
        }
        raise(`couldn't write value ${value} to ${pointer} using an unhandled or unknown type ${type.name} (${type.enumValue}), please file an issue`);
    }
    Il2Cpp.write = write;

    function fromFridaValue(value, type) {
        if (globalThis.Array.isArray(value)) {
            const handle = Memory.alloc(type.class.valueTypeSize);
            const fields = type.class.fields.filter(_ => !_.isStatic);
            for (let i = 0; i < fields.length; i++) {
                const convertedValue = fromFridaValue(value[i], fields[i].type);
                write(handle.add(fields[i].offset).sub(Il2Cpp.Object.headerSize), convertedValue, fields[i].type);
            }
            return new Il2Cpp.ValueType(handle, type);
        }
        else if (value instanceof NativePointer) {
            if (type.isByReference) {
                return new Il2Cpp.Reference(value, type);
            }
            switch (type.enumValue) {
                case Il2Cpp.Type.Enum.POINTER:
                    return new Il2Cpp.Pointer(value, type.class.baseType);
                case Il2Cpp.Type.Enum.STRING:
                    return new Il2Cpp.String(value);
                case Il2Cpp.Type.Enum.CLASS:
                case Il2Cpp.Type.Enum.GENERIC_INSTANCE:
                case Il2Cpp.Type.Enum.OBJECT:
                    return new Il2Cpp.Object(value);
                case Il2Cpp.Type.Enum.ARRAY:
                case Il2Cpp.Type.Enum.NARRAY:
                    return new Il2Cpp.Array(value);
                default:
                    return value;
            }
        }
        else if (type.enumValue == Il2Cpp.Type.Enum.BOOLEAN) {
            return !!value;
        }
        else if (type.enumValue == Il2Cpp.Type.Enum.VALUE_TYPE && type.class.isEnum) {
            return fromFridaValue([value], type);
        }
        else {
            return value;
        }
    }
    Il2Cpp.fromFridaValue = fromFridaValue;

    function toFridaValue(value) {
        if (typeof value == "boolean") {
            return +value;
        }
        else if (value instanceof Il2Cpp.ValueType) {
            if (value.type.class.isEnum) {
                return value.field("value__").value;
            }
            else {
                const _ = value.type.class.fields.filter(_ => !_.isStatic).map(_ => toFridaValue(_.bind(value).value));
                return _.length == 0 ? [0] : _;
            }
        }
        else {
            return value;
        }
    }
    Il2Cpp.toFridaValue = toFridaValue;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    getter(Il2Cpp, "module", () => {
        return tryModule() ?? raise("Could not find IL2CPP module");
    });

    async function initialize(blocking = false) {
        const module = tryModule() ??
            (await new Promise(resolve => {
                const [moduleName, fallbackModuleName] = getExpectedModuleNames();
                const timeout = setTimeout(() => {
                    warn(`after 10 seconds, IL2CPP module '${moduleName}' has not been loaded yet, is the app running?`);
                }, 10000);
                const moduleObserver = Process.attachModuleObserver({
                    onAdded(module) {
                        if (module.name == moduleName || (fallbackModuleName && module.name == fallbackModuleName)) {
                            clearTimeout(timeout);
                            setImmediate(() => {
                                resolve(module);
                                moduleObserver.detach();
                            });
                        }
                    }
                });
            }));
        Reflect.defineProperty(Il2Cpp, "module", { value: module });




        if (Il2Cpp.exports.getCorlib().isNull()) {
            return await new Promise(resolve => {
                const interceptor = Interceptor.attach(Il2Cpp.exports.initialize, {
                    onLeave() {
                        interceptor.detach();
                        blocking ? resolve(true) : setImmediate(() => resolve(false));
                    }
                });
            });
        }
        return false;
    }
    Il2Cpp.initialize = initialize;
    function tryModule() {
        const [moduleName, fallback] = getExpectedModuleNames();
        return (Process.findModuleByName(moduleName) ??
            Process.findModuleByName(fallback ?? moduleName) ??
            (Process.platform == "darwin" ? Process.findModuleByAddress(DebugSymbol.fromName("il2cpp_init").address) : undefined)
            ?? undefined);
    }
    function getExpectedModuleNames() {
        if (Il2Cpp.$config.moduleName) {
            return [Il2Cpp.$config.moduleName];
        }
        switch (Process.platform) {
            case "linux":
                return [Android.apiLevel ? "libil2cpp.so" : "GameAssembly.so"];
            case "windows":
                return ["GameAssembly.dll"];
            case "darwin":
                return ["UnityFramework", "GameAssembly.dylib"];
        }
        raise(`${Process.platform} is not supported yet`);
    }
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {

    async function perform(block, flag = "bind") {
        let attachedThread = null;
        try {
            const isInMainThread = await Il2Cpp.initialize(flag == "main");
            if (flag == "main" && !isInMainThread) {
                return perform(() => Il2Cpp.mainThread.schedule(block), "free");
            }
            if (Il2Cpp.currentThread == null) {
                attachedThread = Il2Cpp.domain.attach();
            }
            if (flag == "bind" && attachedThread != null) {
                Script.bindWeak(globalThis, () => attachedThread?.detach());
            }
            const result = block();
            return result instanceof Promise ? await result : result;
        }
        catch (error) {
            Script.nextTick(_ => { throw _; }, error);
            return Promise.reject(error);
        }
        finally {
            if (flag == "free" && attachedThread != null) {
                attachedThread.detach();
            }
        }
    }
    Il2Cpp.perform = perform;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Tracer {

        #state = {
            depth: 0,
            buffer: [],
            history: new Set(),
            flush: () => {
                if (this.#state.depth == 0) {
                    const message = `\n${this.#state.buffer.join("\n")}\n`;
                    if (this.#verbose) {
                        inform(message);
                    }
                    else {
                        const hash = cyrb53(message);
                        if (!this.#state.history.has(hash)) {
                            this.#state.history.add(hash);
                            inform(message);
                        }
                    }
                    this.#state.buffer.length = 0;
                }
            }
        };

        #threadId = Il2Cpp.mainThread.id;

        #verbose = false;

        #applier;

        #targets = [];

        #domain;

        #assemblies;

        #classes;

        #methods;

        #assemblyFilter;

        #classFilter;

        #methodFilter;

        #parameterFilter;
        constructor(applier) {
            this.#applier = applier;
        }

        thread(thread) {
            this.#threadId = thread.id;
            return this;
        }

        verbose(value) {
            this.#verbose = value;
            return this;
        }

        domain() {
            this.#domain = Il2Cpp.domain;
            return this;
        }

        assemblies(...assemblies) {
            this.#assemblies = assemblies;
            return this;
        }

        classes(...classes) {
            this.#classes = classes;
            return this;
        }

        methods(...methods) {
            this.#methods = methods;
            return this;
        }

        filterAssemblies(filter) {
            this.#assemblyFilter = filter;
            return this;
        }

        filterClasses(filter) {
            this.#classFilter = filter;
            return this;
        }

        filterMethods(filter) {
            this.#methodFilter = filter;
            return this;
        }

        filterParameters(filter) {
            this.#parameterFilter = filter;
            return this;
        }

        and() {
            const filterMethod = (method) => {
                if (this.#parameterFilter == undefined) {
                    this.#targets.push(method);
                    return;
                }
                for (const parameter of method.parameters) {
                    if (this.#parameterFilter(parameter)) {
                        this.#targets.push(method);
                        break;
                    }
                }
            };
            const filterMethods = (values) => {
                for (const method of values) {
                    filterMethod(method);
                }
            };
            const filterClass = (klass) => {
                if (this.#methodFilter == undefined) {
                    filterMethods(klass.methods);
                    return;
                }
                for (const method of klass.methods) {
                    if (this.#methodFilter(method)) {
                        filterMethod(method);
                    }
                }
            };
            const filterClasses = (values) => {
                for (const klass of values) {
                    filterClass(klass);
                }
            };
            const filterAssembly = (assembly) => {
                if (this.#classFilter == undefined) {
                    filterClasses(assembly.image.classes);
                    return;
                }
                for (const klass of assembly.image.classes) {
                    if (this.#classFilter(klass)) {
                        filterClass(klass);
                    }
                }
            };
            const filterAssemblies = (assemblies) => {
                for (const assembly of assemblies) {
                    filterAssembly(assembly);
                }
            };
            const filterDomain = (domain) => {
                if (this.#assemblyFilter == undefined) {
                    filterAssemblies(domain.assemblies);
                    return;
                }
                for (const assembly of domain.assemblies) {
                    if (this.#assemblyFilter(assembly)) {
                        filterAssembly(assembly);
                    }
                }
            };
            this.#methods
                ? filterMethods(this.#methods)
                : this.#classes
                    ? filterClasses(this.#classes)
                    : this.#assemblies
                        ? filterAssemblies(this.#assemblies)
                        : this.#domain
                            ? filterDomain(this.#domain)
                            : undefined;
            this.#assemblies = undefined;
            this.#classes = undefined;
            this.#methods = undefined;
            this.#assemblyFilter = undefined;
            this.#classFilter = undefined;
            this.#methodFilter = undefined;
            this.#parameterFilter = undefined;
            return this;
        }

        attach() {
            for (const target of this.#targets) {
                if (!target.virtualAddress.isNull()) {
                    try {
                        this.#applier(target, this.#state, this.#threadId);
                    }
                    catch (e) {
                        switch (e.message) {
                            case /unable to intercept function at \w+; please file a bug/.exec(e.message)?.input:
                            case "already replaced this function":
                                break;
                            default:
                                throw e;
                        }
                    }
                }
            }
        }
    }
    Il2Cpp.Tracer = Tracer;

    function trace(parameters = false) {
        const applier = () => (method, state, threadId) => {
            const paddedVirtualAddress = method.relativeVirtualAddress.toString(16).padStart(8, "0");
            Interceptor.attach(method.virtualAddress, {
                onEnter() {
                    if (this.threadId == threadId) {

                        state.buffer.push(`\x1b[2m0x${paddedVirtualAddress}\x1b[0m ${` `.repeat(state.depth++)}\x1b[35m${method.class.type.name}::\x1b[1m${method.name}\x1b[0m\x1b[0m`);
                    }
                },
                onLeave() {
                    if (this.threadId == threadId) {

                        state.buffer.push(`\x1b[2m0x${paddedVirtualAddress}\x1b[0m ${` `.repeat(--state.depth)}\x1b[33m${method.class.type.name}::\x1b[1m${method.name}\x1b[0m\x1b[0m`);
                        state.flush();
                    }
                }
            });
        };
        const applierWithParameters = () => (method, state, threadId) => {
            const paddedVirtualAddress = method.relativeVirtualAddress.toString(16).padStart(8, "0");
            const startIndex = +!method.isStatic | +Il2Cpp.unityVersionIsBelow201830;
            const callback = function (...args) {
                if (this.threadId == threadId) {
                    const thisParameter = method.isStatic ? undefined : new Il2Cpp.Parameter("this", -1, method.class.type);
                    const parameters = thisParameter ? [thisParameter].concat(method.parameters) : method.parameters;

                    state.buffer.push(`\x1b[2m0x${paddedVirtualAddress}\x1b[0m ${` `.repeat(state.depth++)}\x1b[35m${method.class.type.name}::\x1b[1m${method.name}\x1b[0m\x1b[0m(${parameters.map(e => `\x1b[32m${e.name}\x1b[0m = \x1b[31m${Il2Cpp.fromFridaValue(args[e.position + startIndex], e.type)}\x1b[0m`).join(", ")})`);
                }
                const returnValue = method.nativeFunction(...args);
                if (this.threadId == threadId) {

                    state.buffer.push(`\x1b[2m0x${paddedVirtualAddress}\x1b[0m ${` `.repeat(--state.depth)}\x1b[33m${method.class.type.name}::\x1b[1m${method.name}\x1b[0m\x1b[0m${returnValue == undefined ? "" : ` = \x1b[36m${Il2Cpp.fromFridaValue(returnValue, method.returnType)}`}\x1b[0m`);
                    state.flush();
                }
                return returnValue;
            };
            method.revert();
            const nativeCallback = new NativeCallback(callback, method.returnType.fridaAlias, method.fridaSignature);
            Interceptor.replace(method.virtualAddress, nativeCallback);
        };
        return new Il2Cpp.Tracer(parameters ? applierWithParameters() : applier());
    }
    Il2Cpp.trace = trace;

    function backtrace(mode) {
        const methods = Il2Cpp.domain.assemblies
            .flatMap(_ => _.image.classes.flatMap(_ => _.methods.filter(_ => !_.virtualAddress.isNull())))
            .sort((_, __) => _.virtualAddress.compare(__.virtualAddress));
        const searchInsert = (target) => {
            let left = 0;
            let right = methods.length - 1;
            while (left <= right) {
                const pivot = Math.floor((left + right) / 2);
                const comparison = methods[pivot].virtualAddress.compare(target);
                if (comparison == 0) {
                    return methods[pivot];
                }
                else if (comparison > 0) {
                    right = pivot - 1;
                }
                else {
                    left = pivot + 1;
                }
            }
            return methods[right];
        };
        const applier = () => (method, state, threadId) => {
            Interceptor.attach(method.virtualAddress, function () {
                if (this.threadId == threadId) {
                    const handles = globalThis.Thread.backtrace(this.context, mode);
                    handles.unshift(method.virtualAddress);
                    for (const handle of handles) {
                        if (handle.compare(Il2Cpp.module.base) > 0 && handle.compare(Il2Cpp.module.base.add(Il2Cpp.module.size)) < 0) {
                            const method = searchInsert(handle);
                            if (method) {
                                const offset = handle.sub(method.virtualAddress);
                                if (offset.compare(0xfff) < 0) {

                                    state.buffer.push(`\x1b[2m0x${method.relativeVirtualAddress.toString(16).padStart(8, "0")}\x1b[0m\x1b[2m+0x${offset.toString(16).padStart(3, `0`)}\x1b[0m ${method.class.type.name}::\x1b[1m${method.name}\x1b[0m`);
                                }
                            }
                        }
                    }
                    state.flush();
                }
            });
        };
        return new Il2Cpp.Tracer(applier());
    }
    Il2Cpp.backtrace = backtrace;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Array extends NativeStruct {

        static get headerSize() {
            return Il2Cpp.corlib.class("System.Array").instanceSize;
        }

        get elements() {



            const array = Il2Cpp.string("v").object.method("ToCharArray", 0).invoke();

            const offset = array.handle.offsetOf(_ => _.readS16() == 118) ??
                raise("couldn't find the elements offset in the native array struct");

            getter(Il2Cpp.Array.prototype, "elements", function () {
                return new Il2Cpp.Pointer(this.handle.add(offset), this.elementType);
            }, lazy);
            return this.elements;
        }

        get elementSize() {
            return this.elementType.class.arrayElementSize;
        }

        get elementType() {
            return this.object.class.type.class.baseType;
        }

        get length() {
            return Il2Cpp.exports.arrayGetLength(this);
        }

        get object() {
            return new Il2Cpp.Object(this);
        }

        get(index) {
            if (index < 0 || index >= this.length) {
                raise(`cannot get element at index ${index} as the array length is ${this.length}`);
            }
            return this.elements.get(index);
        }

        set(index, value) {
            if (index < 0 || index >= this.length) {
                raise(`cannot set element at index ${index} as the array length is ${this.length}`);
            }
            this.elements.set(index, value);
        }

        toString() {
            return this.isNull() ? "null" : `[${this.elements.read(this.length, 0)}]`;
        }

        *[Symbol.iterator]() {
            for (let i = 0; i < this.length; i++) {
                yield this.elements.get(i);
            }
        }
    }
    __decorate([
        lazy
    ], Array.prototype, "elementSize", null);
    __decorate([
        lazy
    ], Array.prototype, "elementType", null);
    __decorate([
        lazy
    ], Array.prototype, "length", null);
    __decorate([
        lazy
    ], Array.prototype, "object", null);
    __decorate([
        lazy
    ], Array, "headerSize", null);
    Il2Cpp.Array = Array;

    function array(klass, lengthOrElements) {
        const length = typeof lengthOrElements == "number" ? lengthOrElements : lengthOrElements.length;
        const array = new Il2Cpp.Array(Il2Cpp.exports.arrayNew(klass, length));
        if (globalThis.Array.isArray(lengthOrElements)) {
            array.elements.write(lengthOrElements);
        }
        return array;
    }
    Il2Cpp.array = array;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    let Assembly = class Assembly extends NativeStruct {

        get image() {
            if (Il2Cpp.exports.assemblyGetImage.isNull()) {









                const runtimeModule = this.object
                    .tryMethod("GetType", 1)
                    ?.invoke(Il2Cpp.string("<Module>"))
                    ?.asNullable()
                    ?.tryMethod("get_Module")
                    ?.invoke() ??
                    this.object.tryMethod("GetModules", 1)?.invoke(false)?.get(0) ??
                    raise(`couldn't find the runtime module object of assembly ${this.name}`);
                return new Il2Cpp.Image(runtimeModule.field("_impl").value);
            }
            return new Il2Cpp.Image(Il2Cpp.exports.assemblyGetImage(this));
        }

        get name() {
            return this.image.name.replace(".dll", "");
        }

        get object() {
            for (const _ of Il2Cpp.domain.object.method("GetAssemblies", 1).invoke(false)) {
                if (_.field("_mono_assembly").value.equals(this)) {
                    return _;
                }
            }
            raise("couldn't find the object of the native assembly struct");
        }
    };
    __decorate([
        lazy
    ], Assembly.prototype, "name", null);
    __decorate([
        lazy
    ], Assembly.prototype, "object", null);
    Assembly = __decorate([
        recycle
    ], Assembly);
    Il2Cpp.Assembly = Assembly;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    let Class = class Class extends NativeStruct {

        get actualInstanceSize() {
            const SystemString = Il2Cpp.corlib.class("System.String");

            const offset = SystemString.handle.offsetOf(_ => _.readInt() == SystemString.instanceSize - 2)
                ?? raise("couldn't find the actual instance size offset in the native class struct");

            getter(Il2Cpp.Class.prototype, "actualInstanceSize", function () {
                return this.handle.add(offset).readS32();
            }, lazy);
            return this.actualInstanceSize;
        }

        get arrayClass() {
            return new Il2Cpp.Class(Il2Cpp.exports.classGetArrayClass(this, 1));
        }

        get arrayElementSize() {
            return Il2Cpp.exports.classGetArrayElementSize(this);
        }

        get assemblyName() {
            return Il2Cpp.exports.classGetAssemblyName(this).readUtf8String().replace(".dll", "");
        }

        get declaringClass() {
            return new Il2Cpp.Class(Il2Cpp.exports.classGetDeclaringType(this)).asNullable();
        }

        get baseType() {
            return new Il2Cpp.Type(Il2Cpp.exports.classGetBaseType(this)).asNullable();
        }

        get elementClass() {
            return new Il2Cpp.Class(Il2Cpp.exports.classGetElementClass(this)).asNullable();
        }

        get fields() {
            return readNativeIterator(_ => Il2Cpp.exports.classGetFields(this, _)).map(_ => new Il2Cpp.Field(_));
        }

        get flags() {
            return Il2Cpp.exports.classGetFlags(this);
        }

        get fullName() {
            return this.namespace ? `${this.namespace}.${this.name}` : this.name;
        }

        get genericClass() {





            const klass = this.image.tryClass(this.fullName)?.asNullable();
            return klass?.equals(this) ? null : klass ?? null;
        }

        get generics() {
            if (!this.isGeneric && !this.isInflated) {
                return [];
            }
            const types = this.type.object.method("GetGenericArguments").invoke();
            return globalThis.Array.from(types).map(_ => new Il2Cpp.Class(Il2Cpp.exports.classFromObject(_)));
        }

        get hasReferences() {
            return !!Il2Cpp.exports.classHasReferences(this);
        }

        get hasStaticConstructor() {
            const staticConstructor = this.tryMethod(".cctor");
            return staticConstructor != null && !staticConstructor.virtualAddress.isNull();
        }

        get image() {
            return new Il2Cpp.Image(Il2Cpp.exports.classGetImage(this));
        }

        get instanceSize() {
            return Il2Cpp.exports.classGetInstanceSize(this);
        }

        get isAbstract() {
            return !!Il2Cpp.exports.classIsAbstract(this);
        }

        get isBlittable() {
            return !!Il2Cpp.exports.classIsBlittable(this);
        }

        get isEnum() {
            return !!Il2Cpp.exports.classIsEnum(this);
        }

        get isGeneric() {
            return !!Il2Cpp.exports.classIsGeneric(this);
        }

        get isInflated() {
            return !!Il2Cpp.exports.classIsInflated(this);
        }

        get isInterface() {
            return !!Il2Cpp.exports.classIsInterface(this);
        }

        get isStruct() {
            return this.isValueType && !this.isEnum;
        }

        get isValueType() {
            return !!Il2Cpp.exports.classIsValueType(this);
        }

        get interfaces() {
            return readNativeIterator(_ => Il2Cpp.exports.classGetInterfaces(this, _)).map(_ => new Il2Cpp.Class(_));
        }

        get methods() {
            return readNativeIterator(_ => Il2Cpp.exports.classGetMethods(this, _)).map(_ => new Il2Cpp.Method(_));
        }

        get name() {
            return Il2Cpp.exports.classGetName(this).readUtf8String();
        }

        get namespace() {
            return Il2Cpp.exports.classGetNamespace(this).readUtf8String() || undefined;
        }

        get nestedClasses() {
            return readNativeIterator(_ => Il2Cpp.exports.classGetNestedClasses(this, _)).map(_ => new Il2Cpp.Class(_));
        }

        get parent() {
            return new Il2Cpp.Class(Il2Cpp.exports.classGetParent(this)).asNullable();
        }

        get pointerClass() {
            return new Il2Cpp.Class(Il2Cpp.exports.classFromObject(this.type.object.method("MakePointerType").invoke()));
        }

        get rank() {
            let rank = 0;
            const name = this.name;
            for (let i = this.name.length - 1; i > 0; i--) {
                const c = name[i];
                if (c == "]")
                    rank++;
                else if (c == "[" || rank == 0)
                    break;
                else if (c == ",")
                    rank++;
                else
                    break;
            }
            return rank;
        }

        get staticFieldsData() {
            return Il2Cpp.exports.classGetStaticFieldData(this);
        }

        get valueTypeSize() {
            return Il2Cpp.exports.classGetValueTypeSize(this, NULL);
        }

        get type() {
            return new Il2Cpp.Type(Il2Cpp.exports.classGetType(this));
        }

        alloc() {
            return new Il2Cpp.Object(Il2Cpp.exports.objectNew(this));
        }

        field(name) {
            return this.tryField(name) ?? raise(`couldn't find field ${name} in class ${this.type.name}`);
        }

        *hierarchy(options) {
            let klass = options?.includeCurrent ?? true ? this : this.parent;
            while (klass) {
                yield klass;
                klass = klass.parent;
            }
        }

        inflate(...classes) {
            if (!this.isGeneric) {
                raise(`cannot inflate class ${this.type.name} as it has no generic parameters`);
            }
            if (this.generics.length != classes.length) {
                raise(`cannot inflate class ${this.type.name} as it needs ${this.generics.length} generic parameter(s), not ${classes.length}`);
            }
            const types = classes.map(_ => _.type.object);
            const typeArray = Il2Cpp.array(Il2Cpp.corlib.class("System.Type"), types);
            const inflatedType = this.type.object.method("MakeGenericType", 1).invoke(typeArray);
            return new Il2Cpp.Class(Il2Cpp.exports.classFromObject(inflatedType));
        }

        initialize() {
            Il2Cpp.exports.classInitialize(this);
            return this;
        }

        isAssignableFrom(other) {
            return !!Il2Cpp.exports.classIsAssignableFrom(this, other);
        }

        isSubclassOf(other, checkInterfaces) {
            return !!Il2Cpp.exports.classIsSubclassOf(this, other, +checkInterfaces);
        }

        method(name, parameterCount = -1) {
            return this.tryMethod(name, parameterCount) ?? raise(`couldn't find method ${name} in class ${this.type.name}`);
        }

        nested(name) {
            return this.tryNested(name) ?? raise(`couldn't find nested class ${name} in class ${this.type.name}`);
        }

        new() {
            const object = this.alloc();
            const exceptionArray = Memory.alloc(Process.pointerSize);
            Il2Cpp.exports.objectInitialize(object, exceptionArray);
            const exception = exceptionArray.readPointer();
            if (!exception.isNull()) {
                raise(new Il2Cpp.Object(exception).toString());
            }
            return object;
        }

        tryField(name) {
            return new Il2Cpp.Field(Il2Cpp.exports.classGetFieldFromName(this, Memory.allocUtf8String(name))).asNullable();
        }

        tryMethod(name, parameterCount = -1) {
            return new Il2Cpp.Method(Il2Cpp.exports.classGetMethodFromName(this, Memory.allocUtf8String(name), parameterCount)).asNullable();
        }

        tryNested(name) {
            return this.nestedClasses.find(_ => _.name == name);
        }

        toString() {
            const inherited = [this.parent].concat(this.interfaces);
            return `\
${this.isEnum ? `enum` : this.isStruct ? `struct` : this.isInterface ? `interface` : `class`} \
${this.type.name}\
${inherited ? ` : ${inherited.map(_ => _?.type.name).join(`, `)}` : ``}
{
    ${this.fields.join(`\n    `)}
    ${this.methods.join(`\n    `)}
}`;
        }

        static enumerate(block) {
            const callback = new NativeCallback(_ => block(new Il2Cpp.Class(_)), "void", ["pointer", "pointer"]);
            return Il2Cpp.exports.classForEach(callback, NULL);
        }
    };
    __decorate([
        lazy
    ], Class.prototype, "arrayClass", null);
    __decorate([
        lazy
    ], Class.prototype, "arrayElementSize", null);
    __decorate([
        lazy
    ], Class.prototype, "assemblyName", null);
    __decorate([
        lazy
    ], Class.prototype, "declaringClass", null);
    __decorate([
        lazy
    ], Class.prototype, "baseType", null);
    __decorate([
        lazy
    ], Class.prototype, "elementClass", null);
    __decorate([
        lazy
    ], Class.prototype, "fields", null);
    __decorate([
        lazy
    ], Class.prototype, "flags", null);
    __decorate([
        lazy
    ], Class.prototype, "fullName", null);
    __decorate([
        lazy
    ], Class.prototype, "generics", null);
    __decorate([
        lazy
    ], Class.prototype, "hasReferences", null);
    __decorate([
        lazy
    ], Class.prototype, "hasStaticConstructor", null);
    __decorate([
        lazy
    ], Class.prototype, "image", null);
    __decorate([
        lazy
    ], Class.prototype, "instanceSize", null);
    __decorate([
        lazy
    ], Class.prototype, "isAbstract", null);
    __decorate([
        lazy
    ], Class.prototype, "isBlittable", null);
    __decorate([
        lazy
    ], Class.prototype, "isEnum", null);
    __decorate([
        lazy
    ], Class.prototype, "isGeneric", null);
    __decorate([
        lazy
    ], Class.prototype, "isInflated", null);
    __decorate([
        lazy
    ], Class.prototype, "isInterface", null);
    __decorate([
        lazy
    ], Class.prototype, "isValueType", null);
    __decorate([
        lazy
    ], Class.prototype, "interfaces", null);
    __decorate([
        lazy
    ], Class.prototype, "methods", null);
    __decorate([
        lazy
    ], Class.prototype, "name", null);
    __decorate([
        lazy
    ], Class.prototype, "namespace", null);
    __decorate([
        lazy
    ], Class.prototype, "nestedClasses", null);
    __decorate([
        lazy
    ], Class.prototype, "parent", null);
    __decorate([
        lazy
    ], Class.prototype, "pointerClass", null);
    __decorate([
        lazy
    ], Class.prototype, "rank", null);
    __decorate([
        lazy
    ], Class.prototype, "staticFieldsData", null);
    __decorate([
        lazy
    ], Class.prototype, "valueTypeSize", null);
    __decorate([
        lazy
    ], Class.prototype, "type", null);
    Class = __decorate([
        recycle
    ], Class);
    Il2Cpp.Class = Class;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {

    function delegate(klass, block) {
        const SystemDelegate = Il2Cpp.corlib.class("System.Delegate");
        const SystemMulticastDelegate = Il2Cpp.corlib.class("System.MulticastDelegate");
        if (!SystemDelegate.isAssignableFrom(klass)) {
            raise(`cannot create a delegate for ${klass.type.name} as it's a non-delegate class`);
        }
        if (klass.equals(SystemDelegate) || klass.equals(SystemMulticastDelegate)) {
            raise(`cannot create a delegate for neither ${SystemDelegate.type.name} nor ${SystemMulticastDelegate.type.name}, use a subclass instead`);
        }
        const delegate = klass.alloc();
        const key = delegate.handle.toString();
        const Invoke = delegate.tryMethod("Invoke") ?? raise(`cannot create a delegate for ${klass.type.name}, there is no Invoke method`);
        delegate.method(".ctor").invoke(delegate, Invoke.handle);
        const callback = Invoke.wrap(block);
        delegate.field("method_ptr").value = callback;
        delegate.field("invoke_impl").value = callback;
        Il2Cpp._callbacksToKeepAlive[key] = callback;
        return delegate;
    }
    Il2Cpp.delegate = delegate;

    Il2Cpp._callbacksToKeepAlive = {};
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    let Domain = class Domain extends NativeStruct {

        get assemblies() {
            let handles = readNativeList(_ => Il2Cpp.exports.domainGetAssemblies(this, _));
            if (handles.length == 0) {
                const assemblyObjects = this.object.method("GetAssemblies").overload().invoke();
                handles = globalThis.Array.from(assemblyObjects).map(_ => _.field("_mono_assembly").value);
            }
            return handles.map(_ => new Il2Cpp.Assembly(_));
        }

        get object() {
            return Il2Cpp.corlib.class("System.AppDomain").method("get_CurrentDomain").invoke();
        }

        assembly(name) {
            return this.tryAssembly(name) ?? raise(`couldn't find assembly ${name}`);
        }

        attach() {
            return new Il2Cpp.Thread(Il2Cpp.exports.threadAttach(this));
        }

        tryAssembly(name) {
            return new Il2Cpp.Assembly(Il2Cpp.exports.domainGetAssemblyFromName(this, Memory.allocUtf8String(name))).asNullable();
        }
    };
    __decorate([
        lazy
    ], Domain.prototype, "assemblies", null);
    __decorate([
        lazy
    ], Domain.prototype, "object", null);
    Domain = __decorate([
        recycle
    ], Domain);
    Il2Cpp.Domain = Domain;

    getter(Il2Cpp, "domain", () => {
        return new Il2Cpp.Domain(Il2Cpp.exports.domainGet());
    }, lazy);
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Field extends NativeStruct {

        get class() {
            return new Il2Cpp.Class(Il2Cpp.exports.fieldGetClass(this));
        }

        get flags() {
            return Il2Cpp.exports.fieldGetFlags(this);
        }

        get isLiteral() {
            return (this.flags & 64 ) != 0;
        }

        get isStatic() {
            return (this.flags & 16 ) != 0;
        }

        get isThreadStatic() {
            const offset = Il2Cpp.corlib.class("System.AppDomain").field("type_resolve_in_progress").offset;

            getter(Il2Cpp.Field.prototype, "isThreadStatic", function () {
                return this.offset == offset;
            }, lazy);
            return this.isThreadStatic;
        }

        get modifier() {
            switch (this.flags & 7 ) {
                case 1 :
                    return "private";
                case 2 :
                    return "private protected";
                case 3 :
                    return "internal";
                case 4 :
                    return "protected";
                case 5 :
                    return "protected internal";
                case 6 :
                    return "public";
            }
        }

        get name() {
            return Il2Cpp.exports.fieldGetName(this).readUtf8String();
        }

        get offset() {
            return Il2Cpp.exports.fieldGetOffset(this);
        }

        get type() {
            return new Il2Cpp.Type(Il2Cpp.exports.fieldGetType(this));
        }

        get value() {
            if (!this.isStatic) {
                raise(`cannot access instance field ${this.class.type.name}::${this.name} from a class, use an object instead`);
            }
            const handle = Memory.alloc(Process.pointerSize);
            Il2Cpp.exports.fieldGetStaticValue(this.handle, handle);
            return Il2Cpp.read(handle, this.type);
        }

        set value(value) {
            if (!this.isStatic) {
                raise(`cannot access instance field ${this.class.type.name}::${this.name} from a class, use an object instead`);
            }
            if (this.isThreadStatic || this.isLiteral) {
                raise(`cannot write the value of field ${this.name} as it's thread static or literal`);
            }
            const handle =


            value instanceof Il2Cpp.Object && this.type.class.isValueType
                ? value.unbox()
                : value instanceof NativeStruct
                    ? value.handle
                    : value instanceof NativePointer
                        ? value
                        : Il2Cpp.write(Memory.alloc(this.type.class.valueTypeSize), value, this.type);
            Il2Cpp.exports.fieldSetStaticValue(this.handle, handle);
        }

        toString() {
            return `\
${this.isThreadStatic ? `[ThreadStatic] ` : ``}\
${this.isStatic ? `static ` : ``}\
${this.type.name} \
${this.name}\
${this.isLiteral ? ` = ${this.type.class.isEnum ? Il2Cpp.read(this.value.handle, this.type.class.baseType) : this.value}` : ``};\
${this.isThreadStatic || this.isLiteral ? `` : ` // 0x${this.offset.toString(16)}`}`;
        }

        bind(instance) {
            if (this.isStatic) {
                raise(`cannot bind static field ${this.class.type.name}::${this.name} to an instance`);
            }
            const offset = this.offset - (instance instanceof Il2Cpp.ValueType ? Il2Cpp.Object.headerSize : 0);
            return new Proxy(this, {
                get(target, property) {
                    if (property == "value") {
                        return Il2Cpp.read(instance.handle.add(offset), target.type);
                    }
                    return Reflect.get(target, property);
                },
                set(target, property, value) {
                    if (property == "value") {
                        Il2Cpp.write(instance.handle.add(offset), value, target.type);
                        return true;
                    }
                    return Reflect.set(target, property, value);
                }
            });
        }
    }
    __decorate([
        lazy
    ], Field.prototype, "class", null);
    __decorate([
        lazy
    ], Field.prototype, "flags", null);
    __decorate([
        lazy
    ], Field.prototype, "isLiteral", null);
    __decorate([
        lazy
    ], Field.prototype, "isStatic", null);
    __decorate([
        lazy
    ], Field.prototype, "isThreadStatic", null);
    __decorate([
        lazy
    ], Field.prototype, "modifier", null);
    __decorate([
        lazy
    ], Field.prototype, "name", null);
    __decorate([
        lazy
    ], Field.prototype, "offset", null);
    __decorate([
        lazy
    ], Field.prototype, "type", null);
    Il2Cpp.Field = Field;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class GCHandle {
        handle;

        constructor(handle) {
            this.handle = handle;
        }

        get target() {
            return new Il2Cpp.Object(Il2Cpp.exports.gcHandleGetTarget(this.handle)).asNullable();
        }

        free() {
            return Il2Cpp.exports.gcHandleFree(this.handle);
        }
    }
    Il2Cpp.GCHandle = GCHandle;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    let Image = class Image extends NativeStruct {

        get assembly() {
            return new Il2Cpp.Assembly(Il2Cpp.exports.imageGetAssembly(this));
        }

        get classCount() {
            if (Il2Cpp.unityVersionIsBelow201830) {
                return this.classes.length;
            }
            else {
                return Il2Cpp.exports.imageGetClassCount(this);
            }
        }

        get classes() {
            if (Il2Cpp.unityVersionIsBelow201830) {
                const types = this.assembly.object.method("GetTypes").invoke(false);



                const classes = globalThis.Array.from(types, _ => new Il2Cpp.Class(Il2Cpp.exports.classFromObject(_)));


                const Module = this.tryClass("<Module>");
                if (Module) {
                    classes.unshift(Module);
                }
                return classes;
            }
            else {
                return globalThis.Array.from(globalThis.Array(this.classCount), (_, i) => new Il2Cpp.Class(Il2Cpp.exports.imageGetClass(this, i)));
            }
        }

        get name() {
            return Il2Cpp.exports.imageGetName(this).readUtf8String();
        }

        class(name) {
            return this.tryClass(name) ?? raise(`couldn't find class ${name} in assembly ${this.name}`);
        }

        tryClass(name) {
            const dotIndex = name.lastIndexOf(".");
            const classNamespace = Memory.allocUtf8String(dotIndex == -1 ? "" : name.slice(0, dotIndex));
            const className = Memory.allocUtf8String(name.slice(dotIndex + 1));
            return new Il2Cpp.Class(Il2Cpp.exports.classFromName(this, classNamespace, className)).asNullable();
        }
    };
    __decorate([
        lazy
    ], Image.prototype, "assembly", null);
    __decorate([
        lazy
    ], Image.prototype, "classCount", null);
    __decorate([
        lazy
    ], Image.prototype, "classes", null);
    __decorate([
        lazy
    ], Image.prototype, "name", null);
    Image = __decorate([
        recycle
    ], Image);
    Il2Cpp.Image = Image;

    getter(Il2Cpp, "corlib", () => {
        return new Il2Cpp.Image(Il2Cpp.exports.getCorlib());
    }, lazy);
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class MemorySnapshot extends NativeStruct {

        static capture() {
            return new Il2Cpp.MemorySnapshot();
        }

        constructor(handle = Il2Cpp.exports.memorySnapshotCapture()) {
            super(handle);
        }

        get classes() {
            return readNativeIterator(_ => Il2Cpp.exports.memorySnapshotGetClasses(this, _)).map(_ => new Il2Cpp.Class(_));
        }

        get objects() {

            return readNativeList(_ => Il2Cpp.exports.memorySnapshotGetObjects(this, _)).filter(_ => !_.isNull()).map(_ => new Il2Cpp.Object(_));
        }

        free() {
            Il2Cpp.exports.memorySnapshotFree(this);
        }
    }
    __decorate([
        lazy
    ], MemorySnapshot.prototype, "classes", null);
    __decorate([
        lazy
    ], MemorySnapshot.prototype, "objects", null);
    Il2Cpp.MemorySnapshot = MemorySnapshot;

    function memorySnapshot(block) {
        const memorySnapshot = Il2Cpp.MemorySnapshot.capture();
        const result = block(memorySnapshot);
        memorySnapshot.free();
        return result;
    }
    Il2Cpp.memorySnapshot = memorySnapshot;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Method extends NativeStruct {

        get class() {
            return new Il2Cpp.Class(Il2Cpp.exports.methodGetClass(this));
        }

        get flags() {
            return Il2Cpp.exports.methodGetFlags(this, NULL);
        }

        get implementationFlags() {
            const implementationFlagsPointer = Memory.alloc(Process.pointerSize);
            Il2Cpp.exports.methodGetFlags(this, implementationFlagsPointer);
            return implementationFlagsPointer.readU32();
        }

        get fridaSignature() {
            const types = [];
            for (const parameter of this.parameters) {
                types.push(parameter.type.fridaAlias);
            }
            if (!this.isStatic || Il2Cpp.unityVersionIsBelow201830) {
                types.unshift("pointer");
            }
            if (this.isInflated) {
                types.push("pointer");
            }
            return types;
        }

        get generics() {
            if (!this.isGeneric && !this.isInflated) {
                return [];
            }
            const types = this.object.method("GetGenericArguments").invoke();
            return globalThis.Array.from(types).map(_ => new Il2Cpp.Class(Il2Cpp.exports.classFromObject(_)));
        }

        get isExternal() {
            return (this.implementationFlags & 4096 ) != 0;
        }

        get isGeneric() {
            return !!Il2Cpp.exports.methodIsGeneric(this);
        }

        get isInflated() {
            return !!Il2Cpp.exports.methodIsInflated(this);
        }

        get isStatic() {
            return !Il2Cpp.exports.methodIsInstance(this);
        }

        get isSynchronized() {
            return (this.implementationFlags & 32 ) != 0;
        }

        get modifier() {
            switch (this.flags & 7 ) {
                case 1 :
                    return "private";
                case 2 :
                    return "private protected";
                case 3 :
                    return "internal";
                case 4 :
                    return "protected";
                case 5 :
                    return "protected internal";
                case 6 :
                    return "public";
            }
        }

        get name() {
            return Il2Cpp.exports.methodGetName(this).readUtf8String();
        }

        get nativeFunction() {
            return new NativeFunction(this.virtualAddress, this.returnType.fridaAlias, this.fridaSignature);
        }

        get object() {
            return new Il2Cpp.Object(Il2Cpp.exports.methodGetObject(this, NULL));
        }

        get parameterCount() {
            return Il2Cpp.exports.methodGetParameterCount(this);
        }

        get parameters() {
            return globalThis.Array.from(globalThis.Array(this.parameterCount), (_, i) => {
                const parameterName = Il2Cpp.exports.methodGetParameterName(this, i).readUtf8String();
                const parameterType = Il2Cpp.exports.methodGetParameterType(this, i);
                return new Il2Cpp.Parameter(parameterName, i, new Il2Cpp.Type(parameterType));
            });
        }

        get relativeVirtualAddress() {
            return this.virtualAddress.sub(Il2Cpp.module.base);
        }

        get returnType() {
            return new Il2Cpp.Type(Il2Cpp.exports.methodGetReturnType(this));
        }

        get virtualAddress() {
            const FilterTypeName = Il2Cpp.corlib.class("System.Reflection.Module").initialize().field("FilterTypeName").value;
            const FilterTypeNameMethodPointer = FilterTypeName.field("method_ptr").value;
            const FilterTypeNameMethod = FilterTypeName.field("method").value;

            const offset = FilterTypeNameMethod.offsetOf(_ => _.readPointer().equals(FilterTypeNameMethodPointer))
                ?? raise("couldn't find the virtual address offset in the native method struct");

            getter(Il2Cpp.Method.prototype, "virtualAddress", function () {
                return this.handle.add(offset).readPointer();
            }, lazy);






            Il2Cpp.corlib.class("System.Reflection.Module").method(".cctor").invoke();
            return this.virtualAddress;
        }

        set implementation(block) {
            try {
                Interceptor.replace(this.virtualAddress, this.wrap(block));
            }
            catch (e) {
                switch (e.message) {
                    case "access violation accessing 0x0":
                        raise(`couldn't set implementation for method ${this.name} as it has a NULL virtual address`);
                    case /unable to intercept function at \w+; please file a bug/.exec(e.message)?.input:
                        warn(`couldn't set implementation for method ${this.name} as it may be a thunk`);
                        break;
                    case "already replaced this function":
                        warn(`couldn't set implementation for method ${this.name} as it has already been replaced by a thunk`);
                        break;
                    default:
                        throw e;
                }
            }
        }

        inflate(...classes) {
            if (!this.isGeneric || this.generics.length != classes.length) {
                for (const method of this.overloads()) {
                    if (method.isGeneric && method.generics.length == classes.length) {
                        return method.inflate(...classes);
                    }
                }
                raise(`could not find inflatable signature of method ${this.name} with ${classes.length} generic parameter(s)`);
            }
            const types = classes.map(_ => _.type.object);
            const typeArray = Il2Cpp.array(Il2Cpp.corlib.class("System.Type"), types);
            const inflatedMethodObject = this.object.method("MakeGenericMethod", 1).invoke(typeArray);
            return new Il2Cpp.Method(inflatedMethodObject.field("mhandle").value);
        }

        invoke(...parameters) {
            if (!this.isStatic) {
                raise(`cannot invoke non-static method ${this.name} as it must be invoked throught a Il2Cpp.Object, not a Il2Cpp.Class`);
            }
            return this.invokeRaw(NULL, ...parameters);
        }

        invokeRaw(instance, ...parameters) {
            const allocatedParameters = parameters.map(Il2Cpp.toFridaValue);
            if (!this.isStatic || Il2Cpp.unityVersionIsBelow201830) {
                allocatedParameters.unshift(instance);
            }
            if (this.isInflated) {
                allocatedParameters.push(this.handle);
            }
            try {
                const returnValue = this.nativeFunction(...allocatedParameters);
                return Il2Cpp.fromFridaValue(returnValue, this.returnType);
            }
            catch (e) {
                if (e == null) {
                    raise("an unexpected native invocation exception occurred, this is due to parameter types mismatch");
                }
                switch (e.message) {
                    case "bad argument count":
                        raise(`couldn't invoke method ${this.name} as it needs ${this.parameterCount} parameter(s), not ${parameters.length}`);
                    case "expected a pointer":
                    case "expected number":
                    case "expected array with fields":
                        raise(`couldn't invoke method ${this.name} using incorrect parameter types`);
                    case "breakpoint triggered":
                    case "access violation accessing 0x0":
                        return;
                }
                if (e.message && e.message.startsWith("access violation")) return;
                throw e;
            }
        }

        overload(...typeNamesOrClasses) {
            const method = this.tryOverload(...typeNamesOrClasses);
            return (method ?? raise(`couldn't find overloaded method ${this.name}(${typeNamesOrClasses.map(_ => (_ instanceof Il2Cpp.Class ? _.type.name : _))})`));
        }

        *overloads() {
            for (const klass of this.class.hierarchy()) {
                for (const method of klass.methods) {
                    if (this.name == method.name) {
                        yield method;
                    }
                }
            }
        }

        parameter(name) {
            return this.tryParameter(name) ?? raise(`couldn't find parameter ${name} in method ${this.name}`);
        }

        revert() {
            Interceptor.revert(this.virtualAddress);
            Interceptor.flush();
        }

        tryOverload(...typeNamesOrClasses) {
            const minScore = typeNamesOrClasses.length * 1;
            const maxScore = typeNamesOrClasses.length * 2;
            let candidate = undefined;
            loop: for (const method of this.overloads()) {
                if (method.parameterCount != typeNamesOrClasses.length)
                    continue;
                let score = 0;
                let i = 0;
                for (const parameter of method.parameters) {
                    const desiredTypeNameOrClass = typeNamesOrClasses[i];
                    if (desiredTypeNameOrClass instanceof Il2Cpp.Class) {
                        if (parameter.type.is(desiredTypeNameOrClass.type)) {
                            score += 2;
                        }
                        else if (parameter.type.class.isAssignableFrom(desiredTypeNameOrClass)) {
                            score += 1;
                        }
                        else {
                            continue loop;
                        }
                    }
                    else if (parameter.type.name == desiredTypeNameOrClass) {
                        score += 2;
                    }
                    else {
                        continue loop;
                    }
                    i++;
                }
                if (score < minScore) {
                    continue;
                }
                else if (score == maxScore) {
                    return method;
                }
                else if (candidate == undefined || score > candidate[0]) {
                    candidate = [score, method];
                }
                else if (score == candidate[0]) {















                    let i = 0;
                    for (const parameter of candidate[1].parameters) {




                        if (parameter.type.class.isAssignableFrom(method.parameters[i].type.class)) {
                            candidate = [score, method];
                            continue loop;
                        }
                        i++;
                    }
                }
            }
            return candidate?.[1];
        }

        tryParameter(name) {
            return this.parameters.find(_ => _.name == name);
        }

        toString() {
            return `\
${this.isStatic ? `static ` : ``}\
${this.returnType.name} \
${this.name}\
${this.generics.length > 0 ? `<${this.generics.map(_ => _.type.name).join(",")}>` : ""}\
(${this.parameters.join(`, `)});\
${this.virtualAddress.isNull() ? `` : ` // 0x${this.relativeVirtualAddress.toString(16).padStart(8, `0`)}`}`;
        }

        bind(instance) {
            if (this.isStatic) {
                raise(`cannot bind static method ${this.class.type.name}::${this.name} to an instance`);
            }
            return new Proxy(this, {
                get(target, property, receiver) {
                    switch (property) {
                        case "invoke":









                            const handle = instance instanceof Il2Cpp.ValueType
                                ? target.class.isValueType
                                    ? instance.handle.sub(structMethodsRequireObjectInstances() ? Il2Cpp.Object.headerSize : 0)
                                    : raise(`cannot invoke method ${target.class.type.name}::${target.name} against a value type, you must box it first`)
                                : target.class.isValueType
                                    ? instance.handle.add(structMethodsRequireObjectInstances() ? 0 : Il2Cpp.Object.headerSize)
                                    : instance.handle;
                            return target.invokeRaw.bind(target, handle);
                        case "overloads":
                            return function* () {
                                for (const method of target[property]()) {
                                    if (!method.isStatic) {
                                        yield method;
                                    }
                                }
                            };
                        case "inflate":
                        case "overload":
                        case "tryOverload":
                            const member = Reflect.get(target, property).bind(receiver);
                            return function (...args) {
                                return member(...args)?.bind(instance);
                            };
                    }
                    return Reflect.get(target, property);
                }
            });
        }

        wrap(block) {
            const startIndex = +!this.isStatic | +Il2Cpp.unityVersionIsBelow201830;
            return new NativeCallback((...args) => {
                const thisObject = this.isStatic
                    ? this.class
                    : this.class.isValueType
                        ? new Il2Cpp.ValueType(args[0].add(structMethodsRequireObjectInstances() ? Il2Cpp.Object.headerSize : 0), this.class.type)
                        : new Il2Cpp.Object(args[0]);
                const parameters = this.parameters.map((_, i) => Il2Cpp.fromFridaValue(args[i + startIndex], _.type));
                const result = block.call(thisObject, ...parameters);
                return Il2Cpp.toFridaValue(result);
            }, this.returnType.fridaAlias, this.fridaSignature);
        }
    }
    __decorate([
        lazy
    ], Method.prototype, "class", null);
    __decorate([
        lazy
    ], Method.prototype, "flags", null);
    __decorate([
        lazy
    ], Method.prototype, "implementationFlags", null);
    __decorate([
        lazy
    ], Method.prototype, "fridaSignature", null);
    __decorate([
        lazy
    ], Method.prototype, "generics", null);
    __decorate([
        lazy
    ], Method.prototype, "isExternal", null);
    __decorate([
        lazy
    ], Method.prototype, "isGeneric", null);
    __decorate([
        lazy
    ], Method.prototype, "isInflated", null);
    __decorate([
        lazy
    ], Method.prototype, "isStatic", null);
    __decorate([
        lazy
    ], Method.prototype, "isSynchronized", null);
    __decorate([
        lazy
    ], Method.prototype, "modifier", null);
    __decorate([
        lazy
    ], Method.prototype, "name", null);
    __decorate([
        lazy
    ], Method.prototype, "nativeFunction", null);
    __decorate([
        lazy
    ], Method.prototype, "object", null);
    __decorate([
        lazy
    ], Method.prototype, "parameterCount", null);
    __decorate([
        lazy
    ], Method.prototype, "parameters", null);
    __decorate([
        lazy
    ], Method.prototype, "relativeVirtualAddress", null);
    __decorate([
        lazy
    ], Method.prototype, "returnType", null);
    Il2Cpp.Method = Method;
    let structMethodsRequireObjectInstances = () => {
        const object = Il2Cpp.corlib.class("System.Int64").alloc();
        object.field("m_value").value = 0xdeadbeef;




        const result = object.method("Equals", 1).overload(object.class).invokeRaw(object, 0xdeadbeef);
        return (structMethodsRequireObjectInstances = () => result)();
    };
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Object extends NativeStruct {

        static get headerSize() {
            return Il2Cpp.corlib.class("System.Object").instanceSize;
        }

        get base() {
            if (this.class.parent == null) {
                raise(`class ${this.class.type.name} has no parent`);
            }
            return new Proxy(this, {
                get(target, property, receiver) {
                    if (property == "class") {
                        return Reflect.get(target, property).parent;
                    }
                    else if (property == "base") {
                        return Reflect.getOwnPropertyDescriptor(Il2Cpp.Object.prototype, property).get.bind(receiver)();
                    }
                    return Reflect.get(target, property);
                }
            });
        }

        get class() {
            return new Il2Cpp.Class(Il2Cpp.exports.objectGetClass(this));
        }

        get monitor() {
            return new Il2Cpp.Object.Monitor(this);
        }

        get size() {
            return Il2Cpp.exports.objectGetSize(this);
        }

        field(name) {
            return this.tryField(name) ?? raise(`couldn't find non-static field ${name} in hierarchy of class ${this.class.type.name}`);
        }

        method(name, parameterCount = -1) {
            return this.tryMethod(name, parameterCount) ?? raise(`couldn't find non-static method ${name} in hierarchy of class ${this.class.type.name}`);
        }

        ref(pin) {
            return new Il2Cpp.GCHandle(Il2Cpp.exports.gcHandleNew(this, +pin));
        }

        virtualMethod(method) {
            return new Il2Cpp.Method(Il2Cpp.exports.objectGetVirtualMethod(this, method)).bind(this);
        }

        tryField(name) {
            const field = this.class.tryField(name);
            if (field?.isStatic) {


                for (const klass of this.class.hierarchy({ includeCurrent: false })) {
                    for (const field of klass.fields) {
                        if (field.name == name && !field.isStatic) {
                            return field.bind(this);
                        }
                    }
                }
                return undefined;
            }
            return field?.bind(this);
        }

        tryMethod(name, parameterCount = -1) {
            const method = this.class.tryMethod(name, parameterCount);
            if (method?.isStatic) {
                for (const klass of this.class.hierarchy()) {
                    for (const method of klass.methods) {
                        if (method.name == name && !method.isStatic && (parameterCount < 0 || method.parameterCount == parameterCount)) {
                            return method.bind(this);
                        }
                    }
                }
                return undefined;
            }
            return method?.bind(this);
        }

        toString() {
            return this.isNull() ? "null" : this.method("ToString", 0).invoke().content ?? "null";
        }

        unbox() {
            return this.class.isValueType
                ? new Il2Cpp.ValueType(Il2Cpp.exports.objectUnbox(this), this.class.type)
                : raise(`couldn't unbox instances of ${this.class.type.name} as they are not value types`);
        }

        weakRef(trackResurrection) {
            return new Il2Cpp.GCHandle(Il2Cpp.exports.gcHandleNewWeakRef(this, +trackResurrection));
        }
    }
    __decorate([
        lazy
    ], Object.prototype, "class", null);
    __decorate([
        lazy
    ], Object.prototype, "size", null);
    __decorate([
        lazy
    ], Object, "headerSize", null);
    Il2Cpp.Object = Object;
    (function (Object) {
        class Monitor {
            handle;

            constructor( handle) {
                this.handle = handle;
            }

            enter() {
                return Il2Cpp.exports.monitorEnter(this.handle);
            }

            exit() {
                return Il2Cpp.exports.monitorExit(this.handle);
            }

            pulse() {
                return Il2Cpp.exports.monitorPulse(this.handle);
            }

            pulseAll() {
                return Il2Cpp.exports.monitorPulseAll(this.handle);
            }

            tryEnter(timeout) {
                return !!Il2Cpp.exports.monitorTryEnter(this.handle, timeout);
            }

            tryWait(timeout) {
                return !!Il2Cpp.exports.monitorTryWait(this.handle, timeout);
            }

            wait() {
                return Il2Cpp.exports.monitorWait(this.handle);
            }
        }
        Object.Monitor = Monitor;
    })(Object = Il2Cpp.Object || (Il2Cpp.Object = {}));
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Parameter {

        name;

        position;

        type;
        constructor(name, position, type) {
            this.name = name;
            this.position = position;
            this.type = type;
        }

        toString() {
            return `${this.type.name} ${this.name}`;
        }
    }
    Il2Cpp.Parameter = Parameter;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Pointer extends NativeStruct {
        type;
        constructor(handle, type) {
            super(handle);
            this.type = type;
        }

        get(index) {
            return Il2Cpp.read(this.handle.add(index * this.type.class.arrayElementSize), this.type);
        }

        read(length, offset = 0) {
            const values = new globalThis.Array(length);
            for (let i = 0; i < length; i++) {
                values[i] = this.get(i + offset);
            }
            return values;
        }

        set(index, value) {
            Il2Cpp.write(this.handle.add(index * this.type.class.arrayElementSize), value, this.type);
        }

        toString() {
            return this.handle.toString();
        }

        write(values, offset = 0) {
            for (let i = 0; i < values.length; i++) {
                this.set(i + offset, values[i]);
            }
        }
    }
    Il2Cpp.Pointer = Pointer;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Reference extends NativeStruct {
        type;
        constructor(handle, type) {
            super(handle);
            this.type = type;
        }

        get value() {
            return Il2Cpp.read(this.handle, this.type);
        }

        set value(value) {
            Il2Cpp.write(this.handle, value, this.type);
        }

        toString() {
            return this.isNull() ? "null" : `->${this.value}`;
        }
    }
    Il2Cpp.Reference = Reference;

    function reference(value, type) {
        const handle = Memory.alloc(Process.pointerSize);
        switch (typeof value) {
            case "boolean":
                return new Il2Cpp.Reference(handle.writeS8(+value), Il2Cpp.corlib.class("System.Boolean").type);
            case "number":
                switch (type?.enumValue) {
                    case Il2Cpp.Type.Enum.UBYTE:
                        return new Il2Cpp.Reference(handle.writeU8(value), type);
                    case Il2Cpp.Type.Enum.BYTE:
                        return new Il2Cpp.Reference(handle.writeS8(value), type);
                    case Il2Cpp.Type.Enum.CHAR:
                    case Il2Cpp.Type.Enum.USHORT:
                        return new Il2Cpp.Reference(handle.writeU16(value), type);
                    case Il2Cpp.Type.Enum.SHORT:
                        return new Il2Cpp.Reference(handle.writeS16(value), type);
                    case Il2Cpp.Type.Enum.UINT:
                        return new Il2Cpp.Reference(handle.writeU32(value), type);
                    case Il2Cpp.Type.Enum.INT:
                        return new Il2Cpp.Reference(handle.writeS32(value), type);
                    case Il2Cpp.Type.Enum.ULONG:
                        return new Il2Cpp.Reference(handle.writeU64(value), type);
                    case Il2Cpp.Type.Enum.LONG:
                        return new Il2Cpp.Reference(handle.writeS64(value), type);
                    case Il2Cpp.Type.Enum.FLOAT:
                        return new Il2Cpp.Reference(handle.writeFloat(value), type);
                    case Il2Cpp.Type.Enum.DOUBLE:
                        return new Il2Cpp.Reference(handle.writeDouble(value), type);
                }
            case "object":
                if (value instanceof Il2Cpp.ValueType || value instanceof Il2Cpp.Pointer) {
                    return new Il2Cpp.Reference(value.handle, value.type);
                }
                else if (value instanceof Il2Cpp.Object) {
                    return new Il2Cpp.Reference(handle.writePointer(value), value.class.type);
                }
                else if (value instanceof Il2Cpp.String || value instanceof Il2Cpp.Array) {
                    return new Il2Cpp.Reference(handle.writePointer(value), value.object.class.type);
                }
                else if (value instanceof NativePointer) {
                    switch (type?.enumValue) {
                        case Il2Cpp.Type.Enum.NUINT:
                        case Il2Cpp.Type.Enum.NINT:
                            return new Il2Cpp.Reference(handle.writePointer(value), type);
                    }
                }
                else if (value instanceof Int64) {
                    return new Il2Cpp.Reference(handle.writeS64(value), Il2Cpp.corlib.class("System.Int64").type);
                }
                else if (value instanceof UInt64) {
                    return new Il2Cpp.Reference(handle.writeU64(value), Il2Cpp.corlib.class("System.UInt64").type);
                }
            default:
                raise(`couldn't create a reference to ${value} using an unhandled type ${type?.name}`);
        }
    }
    Il2Cpp.reference = reference;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class String extends NativeStruct {

        get content() {
            return Il2Cpp.exports.stringGetChars(this).readUtf16String(this.length);
        }

        set content(value) {

            const offset = Il2Cpp.string("vfsfitvnm").handle.offsetOf(_ => _.readInt() == 9)
                ?? raise("couldn't find the length offset in the native string struct");
            globalThis.Object.defineProperty(Il2Cpp.String.prototype, "content", {
                set(value) {
                    Il2Cpp.exports.stringGetChars(this).writeUtf16String(value ?? "");
                    this.handle.add(offset).writeS32(value?.length ?? 0);
                }
            });
            this.content = value;
        }

        get length() {
            return Il2Cpp.exports.stringGetLength(this);
        }

        get object() {
            return new Il2Cpp.Object(this);
        }

        toString() {
            return this.isNull() ? "null" : `"${this.content}"`;
        }
    }
    Il2Cpp.String = String;

    function string(content) {
        return new Il2Cpp.String(Il2Cpp.exports.stringNew(Memory.allocUtf8String(content ?? "")));
    }
    Il2Cpp.string = string;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class Thread extends NativeStruct {

        get id() {
            let get = function () {
                return this.internal.field("thread_id").value.toNumber();
            };

            if (Process.platform != "windows") {
                const currentThreadId = Process.getCurrentThreadId();
                const currentPosixThread = ptr(get.apply(Il2Cpp.currentThread));

                const offset = currentPosixThread.offsetOf(_ => _.readS32() == currentThreadId, 1024) ??
                    raise(`couldn't find the offset for determining the kernel id of a posix thread`);
                const _get = get;
                get = function () {
                    return ptr(_get.apply(this)).add(offset).readS32();
                };
            }
            getter(Il2Cpp.Thread.prototype, "id", get, lazy);
            return this.id;
        }

        get internal() {
            return this.object.tryField("internal_thread")?.value ?? this.object;
        }

        get isFinalizer() {
            return !Il2Cpp.exports.threadIsVm(this);
        }

        get managedId() {
            return this.object.method("get_ManagedThreadId").invoke();
        }

        get object() {
            return new Il2Cpp.Object(this);
        }

        get staticData() {
            return this.internal.field("static_data").value;
        }

        get synchronizationContext() {
            const get_ExecutionContext = this.object.tryMethod("GetMutableExecutionContext") ?? this.object.method("get_ExecutionContext");
            const executionContext = get_ExecutionContext.invoke();





            const synchronizationContext = executionContext.tryField("_syncContext")?.value ??
                executionContext.tryMethod("get_SynchronizationContext")?.invoke() ??
                this.tryLocalValue(Il2Cpp.corlib.class("System.Threading.SynchronizationContext"));
            return synchronizationContext?.asNullable() ?? null;
        }

        detach() {
            return Il2Cpp.exports.threadDetach(this);
        }

        schedule(block) {
            const Post = this.synchronizationContext?.tryMethod("Post");
            if (Post == null) {
                return Process.runOnThread(this.id, block);
            }
            return new Promise(resolve => {
                const delegate = Il2Cpp.delegate(Il2Cpp.corlib.class("System.Threading.SendOrPostCallback"), () => {
                    const result = block();
                    setImmediate(() => resolve(result));
                });














                Script.bindWeak(globalThis, () => {
                    delegate.field("method_ptr").value = delegate.field("invoke_impl").value = Il2Cpp.exports.domainGet;
                });
                Post.invoke(delegate, NULL);
            });
        }

        tryLocalValue(klass) {
            for (let i = 0; i < 16; i++) {
                const base = this.staticData.add(i * Process.pointerSize).readPointer();
                if (!base.isNull()) {
                    const object = new Il2Cpp.Object(base.readPointer()).asNullable();
                    if (object?.class?.isSubclassOf(klass, false)) {
                        return object;
                    }
                }
            }
        }
    }
    __decorate([
        lazy
    ], Thread.prototype, "internal", null);
    __decorate([
        lazy
    ], Thread.prototype, "isFinalizer", null);
    __decorate([
        lazy
    ], Thread.prototype, "managedId", null);
    __decorate([
        lazy
    ], Thread.prototype, "object", null);
    __decorate([
        lazy
    ], Thread.prototype, "staticData", null);
    __decorate([
        lazy
    ], Thread.prototype, "synchronizationContext", null);
    Il2Cpp.Thread = Thread;
    getter(Il2Cpp, "attachedThreads", () => {
        if (Il2Cpp.exports.threadGetAttachedThreads.isNull()) {
            const currentThreadHandle = Il2Cpp.currentThread?.handle ?? raise("Current thread is not attached to IL2CPP");
            const pattern = currentThreadHandle.toMatchPattern();
            const threads = [];
            for (const range of Process.enumerateRanges("rw-")) {
                if (range.file == undefined) {
                    let matches = [];
                    try { matches = Memory.scanSync(range.base, range.size, pattern); } catch(_av){}
                    if (matches.length == 1) {
                        while (true) {
                            const handle = matches[0].address.sub(matches[0].size * threads.length).readPointer();
                            if (handle.isNull() || !handle.readPointer().equals(currentThreadHandle.readPointer())) {
                                break;
                            }
                            threads.unshift(new Il2Cpp.Thread(handle));
                        }
                        break;
                    }
                }
            }
            return threads;
        }
        return readNativeList(Il2Cpp.exports.threadGetAttachedThreads).map(_ => new Il2Cpp.Thread(_));
    });
    getter(Il2Cpp, "currentThread", () => {
        return new Il2Cpp.Thread(Il2Cpp.exports.threadGetCurrent()).asNullable();
    });
    getter(Il2Cpp, "mainThread", () => {





        return Il2Cpp.attachedThreads[0];
    });
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    let Type = class Type extends NativeStruct {

        static get Enum() {
            const _ = (_, block = (_) => _) => block(Il2Cpp.corlib.class(_)).type.enumValue;
            const initial = {
                VOID: _("System.Void"),
                BOOLEAN: _("System.Boolean"),
                CHAR: _("System.Char"),
                BYTE: _("System.SByte"),
                UBYTE: _("System.Byte"),
                SHORT: _("System.Int16"),
                USHORT: _("System.UInt16"),
                INT: _("System.Int32"),
                UINT: _("System.UInt32"),
                LONG: _("System.Int64"),
                ULONG: _("System.UInt64"),
                NINT: _("System.IntPtr"),
                NUINT: _("System.UIntPtr"),
                FLOAT: _("System.Single"),
                DOUBLE: _("System.Double"),
                POINTER: _("System.IntPtr", _ => _.field("m_value")),
                VALUE_TYPE: _("System.Decimal"),
                OBJECT: _("System.Object"),
                STRING: _("System.String"),
                CLASS: _("System.Array"),
                ARRAY: _("System.Void", _ => _.arrayClass),
                NARRAY: _("System.Void", _ => new Il2Cpp.Class(Il2Cpp.exports.classGetArrayClass(_, 2))),
                GENERIC_INSTANCE: _("System.Int32", _ => _.interfaces.find(_ => _.name.endsWith("`1")))
            };


            Reflect.defineProperty(this, "Enum", { value: initial });
            return addFlippedEntries({
                ...initial,
                VAR: _("System.Action`1", _ => _.generics[0]),
                MVAR: _("System.Array", _ => _.method("AsReadOnly", 1).generics[0])
            });
        }

        get class() {
            return new Il2Cpp.Class(Il2Cpp.exports.typeGetClass(this));
        }

        get fridaAlias() {
            function getValueTypeFields(type) {
                const instanceFields = type.class.fields.filter(_ => !_.isStatic);
                return instanceFields.length == 0 ? ["char"] : instanceFields.map(_ => _.type.fridaAlias);
            }
            if (this.isByReference) {
                return "pointer";
            }
            switch (this.enumValue) {
                case Il2Cpp.Type.Enum.VOID:
                    return "void";
                case Il2Cpp.Type.Enum.BOOLEAN:
                    return "bool";
                case Il2Cpp.Type.Enum.CHAR:
                    return "uchar";
                case Il2Cpp.Type.Enum.BYTE:
                    return "int8";
                case Il2Cpp.Type.Enum.UBYTE:
                    return "uint8";
                case Il2Cpp.Type.Enum.SHORT:
                    return "int16";
                case Il2Cpp.Type.Enum.USHORT:
                    return "uint16";
                case Il2Cpp.Type.Enum.INT:
                    return "int32";
                case Il2Cpp.Type.Enum.UINT:
                    return "uint32";
                case Il2Cpp.Type.Enum.LONG:
                    return "int64";
                case Il2Cpp.Type.Enum.ULONG:
                    return "uint64";
                case Il2Cpp.Type.Enum.FLOAT:
                    return "float";
                case Il2Cpp.Type.Enum.DOUBLE:
                    return "double";
                case Il2Cpp.Type.Enum.NINT:
                case Il2Cpp.Type.Enum.NUINT:
                case Il2Cpp.Type.Enum.POINTER:
                case Il2Cpp.Type.Enum.STRING:
                case Il2Cpp.Type.Enum.ARRAY:
                case Il2Cpp.Type.Enum.NARRAY:
                    return "pointer";
                case Il2Cpp.Type.Enum.VALUE_TYPE:
                    return this.class.isEnum ? this.class.baseType.fridaAlias : getValueTypeFields(this);
                case Il2Cpp.Type.Enum.CLASS:
                case Il2Cpp.Type.Enum.OBJECT:
                case Il2Cpp.Type.Enum.GENERIC_INSTANCE:
                    return this.class.isStruct ? getValueTypeFields(this) : this.class.isEnum ? this.class.baseType.fridaAlias : "pointer";
                default:
                    return "pointer";
            }
        }

        get isByReference() {
            return this.name.endsWith("&");
        }

        get isPrimitive() {
            switch (this.enumValue) {
                case Il2Cpp.Type.Enum.BOOLEAN:
                case Il2Cpp.Type.Enum.CHAR:
                case Il2Cpp.Type.Enum.BYTE:
                case Il2Cpp.Type.Enum.UBYTE:
                case Il2Cpp.Type.Enum.SHORT:
                case Il2Cpp.Type.Enum.USHORT:
                case Il2Cpp.Type.Enum.INT:
                case Il2Cpp.Type.Enum.UINT:
                case Il2Cpp.Type.Enum.LONG:
                case Il2Cpp.Type.Enum.ULONG:
                case Il2Cpp.Type.Enum.FLOAT:
                case Il2Cpp.Type.Enum.DOUBLE:
                case Il2Cpp.Type.Enum.NINT:
                case Il2Cpp.Type.Enum.NUINT:
                    return true;
                default:
                    return false;
            }
        }

        get name() {
            try {
                const handle = Il2Cpp.exports.typeGetName(this);
            try {
                return handle.readUtf8String();
            }
            finally {
                Il2Cpp.free(handle);
            }
            } catch {
                return "Error: ToString failed"
            }
        }

        get object() {
            return new Il2Cpp.Object(Il2Cpp.exports.typeGetObject(this));
        }

        get enumValue() {
            return Il2Cpp.exports.typeGetTypeEnum(this);
        }
        is(other) {
            if (Il2Cpp.exports.typeEquals.isNull()) {
                return this.object.method("Equals").invoke(other.object);
            }
            return !!Il2Cpp.exports.typeEquals(this, other);

        }

        toString() {
            return this.name;
        }
    };
    __decorate([
        lazy
    ], Type.prototype, "class", null);
    __decorate([
        lazy
    ], Type.prototype, "fridaAlias", null);
    __decorate([
        lazy
    ], Type.prototype, "isByReference", null);
    __decorate([
        lazy
    ], Type.prototype, "isPrimitive", null);
    __decorate([
        lazy
    ], Type.prototype, "name", null);
    __decorate([
        lazy
    ], Type.prototype, "object", null);
    __decorate([
        lazy
    ], Type.prototype, "enumValue", null);
    __decorate([
        lazy
    ], Type, "Enum", null);
    Type = __decorate([
        recycle
    ], Type);
    Il2Cpp.Type = Type;
})(Il2Cpp || (Il2Cpp = {}));
var Il2Cpp;
(function (Il2Cpp) {
    class ValueType extends NativeStruct {
        type;
        constructor(handle, type) {
            super(handle);
            this.type = type;
        }

        box() {
            return new Il2Cpp.Object(Il2Cpp.exports.valueTypeBox(this.type.class, this));
        }

        field(name) {
            return this.tryField(name) ?? raise(`couldn't find non-static field ${name} in hierarchy of class ${this.type.name}`);
        }

        method(name, parameterCount = -1) {
            return this.tryMethod(name, parameterCount) ?? raise(`couldn't find non-static method ${name} in hierarchy of class ${this.type.name}`);
        }

        tryField(name) {
            const field = this.type.class.tryField(name);
            if (field?.isStatic) {
                for (const klass of this.type.class.hierarchy()) {
                    for (const field of klass.fields) {
                        if (field.name == name && !field.isStatic) {
                            return field.bind(this);
                        }
                    }
                }
                return undefined;
            }
            return field?.bind(this);
        }

        tryMethod(name, parameterCount = -1) {
            const method = this.type.class.tryMethod(name, parameterCount);
            if (method?.isStatic) {
                for (const klass of this.type.class.hierarchy()) {
                    for (const method of klass.methods) {
                        if (method.name == name && !method.isStatic && (parameterCount < 0 || method.parameterCount == parameterCount)) {
                            return method.bind(this);
                        }
                    }
                }
                return undefined;
            }
            return method?.bind(this);
        }

        toString() {
            const ToString = this.method("ToString", 0);
            return this.isNull()
                ? "null"
                :

                    ToString.class.isValueType
                        ? ToString.invoke().content ?? "null"
                        : this.box().toString() ?? "null";
        }
    }
    Il2Cpp.ValueType = ValueType;
})(Il2Cpp || (Il2Cpp = {}));











































globalThis.Il2Cpp = Il2Cpp;




Il2Cpp['$config']['exports']= {
	il2cpp_init: () => Il2Cpp.module.findExportByName("hkwBsSFgxqH"),
	il2cpp_init_utf16: () => Il2Cpp.module.findExportByName("MzRsMmDCbKe"),
	il2cpp_shutdown: () => Il2Cpp.module.findExportByName("gpIBGjpFeMP"),
	il2cpp_set_config_dir: () => Il2Cpp.module.findExportByName("BRcdEwsHPFQ"),
	il2cpp_set_data_dir: () => Il2Cpp.module.findExportByName("IAkmhcCqQlq"),
	il2cpp_set_temp_dir: () => Il2Cpp.module.findExportByName("zgzcVzkuhGC"),
	il2cpp_set_commandline_arguments: () => Il2Cpp.module.findExportByName("OAgRxtMO_df"),
	il2cpp_set_commandline_arguments_utf16: () => Il2Cpp.module.findExportByName("LLfBMHvUNoo"),
	il2cpp_set_config_utf16: () => Il2Cpp.module.findExportByName("wwBZMBfVATR"),
	il2cpp_set_config: () => Il2Cpp.module.findExportByName("QrqgcY_eMSQ"),
	il2cpp_set_memory_callbacks: () => Il2Cpp.module.findExportByName("nJjWkbrnRnp"),
	il2cpp_memory_pool_set_region_size: () => Il2Cpp.module.findExportByName("IEXQDKQhybp"),
	il2cpp_memory_pool_get_region_size: () => Il2Cpp.module.findExportByName("UDjCfRHNqLm"),
	il2cpp_get_corlib: () => Il2Cpp.module.findExportByName("Nb_EcJBKqyO"),
	il2cpp_add_internal_call: () => Il2Cpp.module.findExportByName("oRKPXWv_bvb"),
	il2cpp_resolve_icall: () => Il2Cpp.module.findExportByName("YjzZXKAOhPF"),
	il2cpp_alloc: () => Il2Cpp.module.findExportByName("VxKTMoPYxrM"),
	il2cpp_free: () => Il2Cpp.module.findExportByName("FiPPqfwwrMb"),
	il2cpp_array_class_get: () => Il2Cpp.module.findExportByName("rutjRUZNOpE"),
	il2cpp_array_length: () => Il2Cpp.module.findExportByName("gLMJRVyQhxF"),
	il2cpp_array_get_byte_length: () => Il2Cpp.module.findExportByName("qLaiilSUqGH"),
	il2cpp_array_new: () => Il2Cpp.module.findExportByName("HECvnpShNYW"),
	il2cpp_array_new_specific: () => Il2Cpp.module.findExportByName("MpdhAyE_ZAp"),
	il2cpp_array_new_full: () => Il2Cpp.module.findExportByName("pkxnLDZNDyf"),
	il2cpp_bounded_array_class_get: () => Il2Cpp.module.findExportByName("ZpkRsinLxlT"),
	il2cpp_array_element_size: () => Il2Cpp.module.findExportByName("JnbmTXbSJYT"),
	il2cpp_assembly_get_image: () => Il2Cpp.module.findExportByName("nsZoVvBwl_U"),
	il2cpp_class_for_each: () => Il2Cpp.module.findExportByName("oPaRKoeafxm"),
	il2cpp_class_enum_basetype: () => Il2Cpp.module.findExportByName("qWSHAqMecqY"),
	il2cpp_class_is_inited: () => Il2Cpp.module.findExportByName("MYrJGSWLIsf"),
	il2cpp_class_is_generic: () => Il2Cpp.module.findExportByName("EJeCJdstNPd"),
	il2cpp_class_is_inflated: () => Il2Cpp.module.findExportByName("pbkIQLElqDF"),
	il2cpp_class_is_assignable_from: () => Il2Cpp.module.findExportByName("QftGbIOWtiD"),
	il2cpp_class_is_subclass_of: () => Il2Cpp.module.findExportByName("PkuOQedJDIa"),
	il2cpp_class_has_parent: () => Il2Cpp.module.findExportByName("AadtxIbITeR"),
	il2cpp_class_from_il2cpp_type: () => Il2Cpp.module.findExportByName("KxJclIJnbqx"),
	il2cpp_class_from_name: () => Il2Cpp.module.findExportByName("NvOZuikEvJI"),
	il2cpp_class_from_system_type: () => Il2Cpp.module.findExportByName("PxwaRjWXysp"),
	il2cpp_class_get_element_class: () => Il2Cpp.module.findExportByName("XwKToOXzCfq"),
	il2cpp_class_get_events: () => Il2Cpp.module.findExportByName("WfaGYTxYuIe"),
	il2cpp_class_get_fields: () => Il2Cpp.module.findExportByName("NwOgIeoKYca"),
	il2cpp_class_get_nested_types: () => Il2Cpp.module.findExportByName("GFYLMInJiUA"),
	il2cpp_class_get_interfaces: () => Il2Cpp.module.findExportByName("dACVBjnCmt_"),
	il2cpp_class_get_properties: () => Il2Cpp.module.findExportByName("YMGkoVVuiGv"),
	il2cpp_class_get_property_from_name: () => Il2Cpp.module.findExportByName("TDxEeATWyxh"),
	il2cpp_class_get_field_from_name: () => Il2Cpp.module.findExportByName("AXgoVdZIlD_"),
	il2cpp_class_get_methods: () => Il2Cpp.module.findExportByName("sqeMRjZahwU"),
	il2cpp_class_get_method_from_name: () => Il2Cpp.module.findExportByName("DranOlSNGOT"),
	il2cpp_class_get_name: () => Il2Cpp.module.findExportByName("FhUlhDwxRdy"),
	il2cpp_type_get_name_chunked: () => Il2Cpp.module.findExportByName("_Dzp_zXdycR"),
	il2cpp_class_get_namespace: () => Il2Cpp.module.findExportByName("qxmvr_RHgyv"),
	il2cpp_class_get_parent: () => Il2Cpp.module.findExportByName("CKLKUlYxDRa"),
	il2cpp_class_get_declaring_type: () => Il2Cpp.module.findExportByName("XccyeZV_cnz"),
	il2cpp_class_instance_size: () => Il2Cpp.module.findExportByName("SxcYQRUzNqn"),
	il2cpp_class_num_fields: () => Il2Cpp.module.findExportByName("WkTfSAzFWkF"),
	il2cpp_class_is_valuetype: () => Il2Cpp.module.findExportByName("nzzWXAtmdZF"),
	il2cpp_class_value_size: () => Il2Cpp.module.findExportByName("mWpxxoDZOpZ"),
	il2cpp_class_is_blittable: () => Il2Cpp.module.findExportByName("LLdHdskfEBt"),
	il2cpp_class_get_flags: () => Il2Cpp.module.findExportByName("yAGJzkUtPvi"),
	il2cpp_class_is_abstract: () => Il2Cpp.module.findExportByName("eFvzJgmqmed"),
	il2cpp_class_is_interface: () => Il2Cpp.module.findExportByName("IrsrZathXgO"),
	il2cpp_class_array_element_size: () => Il2Cpp.module.findExportByName("xfSiulCxRYG"),
	il2cpp_class_from_type: () => Il2Cpp.module.findExportByName("svMZucSTJhJ"),
	il2cpp_class_get_type: () => Il2Cpp.module.findExportByName("CipuqlKzoPX"),
	il2cpp_class_get_type_token: () => Il2Cpp.module.findExportByName("WIglEwsxxAR"),
	il2cpp_class_has_attribute: () => Il2Cpp.module.findExportByName("tlqFxHZdCTe"),
	il2cpp_class_has_references: () => Il2Cpp.module.findExportByName("rmIwLZrPJ_S"),
	il2cpp_class_is_enum: () => Il2Cpp.module.findExportByName("cKFlTGKusOy"),
	il2cpp_class_get_image: () => Il2Cpp.module.findExportByName("xBDIrtzMzWM"),
	il2cpp_class_get_assemblyname: () => Il2Cpp.module.findExportByName("uKZhYVjJtaT"),
	il2cpp_class_get_rank: () => Il2Cpp.module.findExportByName("YpAVBcQhYoV"),
	il2cpp_class_get_data_size: () => Il2Cpp.module.findExportByName("SDdcbfwnRJI"),
	il2cpp_class_get_static_field_data: () => Il2Cpp.module.findExportByName("hRXMjKpKQjW"),
	il2cpp_stats_dump_to_file: () => Il2Cpp.module.findExportByName("WQtVwdPwVZG"),
	il2cpp_stats_get_value: () => Il2Cpp.module.findExportByName("QpIaDVwnMMg"),
	il2cpp_domain_get: () => Il2Cpp.module.findExportByName("aUxyAzVeiyb"),
	il2cpp_domain_assembly_open: () => Il2Cpp.module.findExportByName("okajmEMlgWd"),
	il2cpp_domain_get_assemblies: () => Il2Cpp.module.findExportByName("zponbFKbgep"),
	il2cpp_raise_exception: () => Il2Cpp.module.findExportByName("dDuYPdhBnlU"),
	il2cpp_exception_from_name_msg: () => Il2Cpp.module.findExportByName("nglhQGDRDpq"),
	il2cpp_get_exception_argument_null: () => Il2Cpp.module.findExportByName("MFSJXwsfSFB"),
	il2cpp_format_exception: () => Il2Cpp.module.findExportByName("geMpxkfmMXm"),
	il2cpp_format_stack_trace: () => Il2Cpp.module.findExportByName("FFzNGJCgBtP"),
	il2cpp_unhandled_exception: () => Il2Cpp.module.findExportByName("RRZjtqmxfAn"),
	il2cpp_native_stack_trace: () => Il2Cpp.module.findExportByName("JNslesGRFTB"),
	il2cpp_field_get_flags: () => Il2Cpp.module.findExportByName("HcjaiEoKCsb"),
	il2cpp_field_get_from_reflection: () => Il2Cpp.module.findExportByName("tPGwcHEkSnj"),
	il2cpp_field_get_name: () => Il2Cpp.module.findExportByName("jVOZHWPGLfY"),
	il2cpp_field_get_parent: () => Il2Cpp.module.findExportByName("A_HBBvXsMhp"),
	il2cpp_field_get_object: () => Il2Cpp.module.findExportByName("dwpKuLpclQB"),
	il2cpp_field_get_offset: () => Il2Cpp.module.findExportByName("LYNOJnkbEEY"),
	il2cpp_field_get_type: () => Il2Cpp.module.findExportByName("utjTspzDOQV"),
	il2cpp_field_get_value: () => Il2Cpp.module.findExportByName("aGhZwTbQInE"),
	il2cpp_field_get_value_object: () => Il2Cpp.module.findExportByName("HpKyRPubWXK"),
	il2cpp_field_has_attribute: () => Il2Cpp.module.findExportByName("SBfdTHVdlRu"),
	il2cpp_field_set_value: () => Il2Cpp.module.findExportByName("cahAvvimDRf"),
	il2cpp_field_static_get_value: () => Il2Cpp.module.findExportByName("jhKvElGEUct"),
	il2cpp_field_static_set_value: () => Il2Cpp.module.findExportByName("pUeLpZfBJAy"),
	il2cpp_field_set_value_object: () => Il2Cpp.module.findExportByName("cHShCyNChyA"),
	il2cpp_field_is_literal: () => Il2Cpp.module.findExportByName("lzstqWAgGqZ"),
	il2cpp_gc_collect: () => Il2Cpp.module.findExportByName("VLQACtYffEo"),
	il2cpp_gc_collect_a_little: () => Il2Cpp.module.findExportByName("ClAlpAjVsUP"),
	il2cpp_gc_start_incremental_collection: () => Il2Cpp.module.findExportByName("BGmKmlOpqcy"),
	il2cpp_gc_disable: () => Il2Cpp.module.findExportByName("ixWNaLLVGpX"),
	il2cpp_gc_enable: () => Il2Cpp.module.findExportByName("hRljeRpSlfA"),
	il2cpp_gc_is_disabled: () => Il2Cpp.module.findExportByName("lQsKrq_uFfP"),
	il2cpp_gc_set_mode: () => Il2Cpp.module.findExportByName("ihOHaCLpvni"),
	il2cpp_gc_get_max_time_slice_ns: () => Il2Cpp.module.findExportByName("KlisJdRxoGg"),
	il2cpp_gc_set_max_time_slice_ns: () => Il2Cpp.module.findExportByName("catdtKaTyGL"),
	il2cpp_gc_is_incremental: () => Il2Cpp.module.findExportByName("yQSHEgUhLcq"),
	il2cpp_gc_get_used_size: () => Il2Cpp.module.findExportByName("DnGvZqZIkTO"),
	il2cpp_gc_get_heap_size: () => Il2Cpp.module.findExportByName("FciYnPzJPaF"),
	il2cpp_gc_wbarrier_set_field: () => Il2Cpp.module.findExportByName("OnZLCKchkfN"),
	il2cpp_gc_has_strict_wbarriers: () => Il2Cpp.module.findExportByName("DzRrFPGTPeg"),
	il2cpp_gc_set_external_allocation_tracker: () => Il2Cpp.module.findExportByName("tCrdOOXUNCG"),
	il2cpp_gc_set_external_wbarrier_tracker: () => Il2Cpp.module.findExportByName("bZtOvmkxUCo"),
	il2cpp_gc_foreach_heap: () => Il2Cpp.module.findExportByName("cjZvxZeeDAE"),
	il2cpp_stop_gc_world: () => Il2Cpp.module.findExportByName("cMCBpKdQYyC"),
	il2cpp_start_gc_world: () => Il2Cpp.module.findExportByName("urMTQpOepib"),
	il2cpp_gc_alloc_fixed: () => Il2Cpp.module.findExportByName("CSYlHWSYTkU"),
	il2cpp_gc_free_fixed: () => Il2Cpp.module.findExportByName("OtQrBclCSAA"),
	il2cpp_gchandle_new: () => Il2Cpp.module.findExportByName("oUKeVoywQOC"),
	il2cpp_gchandle_new_weakref: () => Il2Cpp.module.findExportByName("FYXJQpbXqqW"),
	il2cpp_gchandle_get_target: () => Il2Cpp.module.findExportByName("KlDZtqKEwQT"),
	il2cpp_gchandle_free: () => Il2Cpp.module.findExportByName("EturGpvuOCx"),
	il2cpp_gchandle_foreach_get_target: () => Il2Cpp.module.findExportByName("bVZXZWxqOOX"),
	il2cpp_object_header_size: () => Il2Cpp.module.findExportByName("LDMpqNMBQwL"),
	il2cpp_array_object_header_size: () => Il2Cpp.module.findExportByName("hNKDsYLrnio"),
	il2cpp_offset_of_array_length_in_array_object_header: () => Il2Cpp.module.findExportByName("ehJLHPlqFmq"),
	il2cpp_offset_of_array_bounds_in_array_object_header: () => Il2Cpp.module.findExportByName("F_YGQTwtajW"),
	il2cpp_allocation_granularity: () => Il2Cpp.module.findExportByName("fPgEOSgKSoI"),
	il2cpp_unity_liveness_allocate_struct: () => Il2Cpp.module.findExportByName("pruCkuLuFfq"),
	il2cpp_unity_liveness_calculation_from_root: () => Il2Cpp.module.findExportByName("KUamnDBijXU"),
	il2cpp_unity_liveness_calculation_from_statics: () => Il2Cpp.module.findExportByName("IxjsOAgfvZd"),
	il2cpp_unity_liveness_finalize: () => Il2Cpp.module.findExportByName("ylliCPUmNfz"),
	il2cpp_unity_liveness_free_struct: () => Il2Cpp.module.findExportByName("CExEiSUYxwx"),
	il2cpp_method_get_return_type: () => Il2Cpp.module.findExportByName("HL_gkbBZCBc"),
	il2cpp_method_get_declaring_type: () => Il2Cpp.module.findExportByName("OnyhBNnpseT"),
	il2cpp_method_get_name: () => Il2Cpp.module.findExportByName("NRKhSQJuXdl"),
	il2cpp_method_get_from_reflection: () => Il2Cpp.module.findExportByName("WaLlNmyVHpo"),
	il2cpp_method_get_object: () => Il2Cpp.module.findExportByName("oQBGtxvqWKb"),
	il2cpp_method_is_generic: () => Il2Cpp.module.findExportByName("RMdxXbHVMEp"),
	il2cpp_method_is_inflated: () => Il2Cpp.module.findExportByName("sqHllx_IAtG"),
	il2cpp_method_is_instance: () => Il2Cpp.module.findExportByName("ryGLjpfMthC"),
	il2cpp_method_get_param_count: () => Il2Cpp.module.findExportByName("TfmmjfJugMb"),
	il2cpp_method_get_param: () => Il2Cpp.module.findExportByName("cqQjOkdTtxF"),
	il2cpp_method_get_class: () => Il2Cpp.module.findExportByName("OgCspRsSsdh"),
	il2cpp_method_has_attribute: () => Il2Cpp.module.findExportByName("aNokDpOueRy"),
	il2cpp_method_get_flags: () => Il2Cpp.module.findExportByName("eEJbfTNNGNr"),
	il2cpp_method_get_token: () => Il2Cpp.module.findExportByName("RlPwzg_v_bT"),
	il2cpp_method_get_param_name: () => Il2Cpp.module.findExportByName("xXqsJhINgoF"),
	il2cpp_property_get_flags: () => Il2Cpp.module.findExportByName("YiOtzzdIuht"),
	il2cpp_property_get_get_method: () => Il2Cpp.module.findExportByName("NASqZgAAiDS"),
	il2cpp_property_get_set_method: () => Il2Cpp.module.findExportByName("LRHJcoPaLJW"),
	il2cpp_property_get_name: () => Il2Cpp.module.findExportByName("IVNoknOWtCr"),
	il2cpp_property_get_parent: () => Il2Cpp.module.findExportByName("bUrvmOCgEOz"),
	il2cpp_object_get_class: () => Il2Cpp.module.findExportByName("thZHOYiCzWR"),
	il2cpp_object_get_size: () => Il2Cpp.module.findExportByName("bHUAqhAMfMn"),
	il2cpp_object_get_virtual_method: () => Il2Cpp.module.findExportByName("lQZowibbAWZ"),
	il2cpp_object_new: () => Il2Cpp.module.findExportByName("ZJmGHrrfvuE"),
	il2cpp_object_unbox: () => Il2Cpp.module.findExportByName("mryPYGkdRhF"),
	il2cpp_value_box: () => Il2Cpp.module.findExportByName("PkolmdBLhca"),
	il2cpp_monitor_enter: () => Il2Cpp.module.findExportByName("wAFqPTOhLqt"),
	il2cpp_monitor_try_enter: () => Il2Cpp.module.findExportByName("ZoWHdifKSLH"),
	il2cpp_monitor_exit: () => Il2Cpp.module.findExportByName("aXHWzllNJ_p"),
	il2cpp_monitor_pulse: () => Il2Cpp.module.findExportByName("STlvmygedaT"),
	il2cpp_monitor_pulse_all: () => Il2Cpp.module.findExportByName("eUWyhjpyRq_"),
	il2cpp_monitor_wait: () => Il2Cpp.module.findExportByName("xOMSagItwTN"),
	il2cpp_monitor_try_wait: () => Il2Cpp.module.findExportByName("CeGlLra_wlM"),
	il2cpp_runtime_invoke: () => Il2Cpp.module.findExportByName("cznPlNjlYvN"),
	il2cpp_runtime_invoke_convert_args: () => Il2Cpp.module.findExportByName("IBCugPYIwZl"),
	il2cpp_runtime_class_init: () => Il2Cpp.module.findExportByName("KhBufSABVGz"),
	il2cpp_runtime_object_init: () => Il2Cpp.module.findExportByName("RVUSZdIPvId"),
	il2cpp_runtime_object_init_exception: () => Il2Cpp.module.findExportByName("BPwFdDaqbKZ"),
	il2cpp_runtime_unhandled_exception_policy_set: () => Il2Cpp.module.findExportByName("dQqAXlIiZHn"),
	il2cpp_string_length: () => Il2Cpp.module.findExportByName("ljnylQhkuqa"),
	il2cpp_string_chars: () => Il2Cpp.module.findExportByName("VIVWapoHFUF"),
	il2cpp_string_new: () => Il2Cpp.module.findExportByName("mEaxMDwjgVC"),
	il2cpp_string_new_len: () => Il2Cpp.module.findExportByName("cqXSOqyyKcv"),
	il2cpp_string_new_utf16: () => Il2Cpp.module.findExportByName("WAwgqOPPGZu"),
	il2cpp_string_new_wrapper: () => Il2Cpp.module.findExportByName("TwYwbHisnFF"),
	il2cpp_string_intern: () => Il2Cpp.module.findExportByName("HjhnXH_TwCm"),
	il2cpp_string_is_interned: () => Il2Cpp.module.findExportByName("qOWuoKj_deP"),
	il2cpp_thread_current: () => Il2Cpp.module.findExportByName("QfbxmMGQWUe"),
	il2cpp_thread_attach: () => Il2Cpp.module.findExportByName("uoPYalTqSjX"),
	il2cpp_thread_detach: () => Il2Cpp.module.findExportByName("mdudgYqNsPC"),
	il2cpp_is_vm_thread: () => Il2Cpp.module.findExportByName("CdrCFpbSFlY"),
	il2cpp_current_thread_walk_frame_stack: () => Il2Cpp.module.findExportByName("SPRXdRpTfTs"),
	il2cpp_thread_walk_frame_stack: () => Il2Cpp.module.findExportByName("ZamFtGhGTag"),
	il2cpp_current_thread_get_top_frame: () => Il2Cpp.module.findExportByName("wqmxlhbcLXl"),
	il2cpp_thread_get_top_frame: () => Il2Cpp.module.findExportByName("_clRVUzeggj"),
	il2cpp_current_thread_get_frame_at: () => Il2Cpp.module.findExportByName("czFlwedbcBe"),
	il2cpp_thread_get_frame_at: () => Il2Cpp.module.findExportByName("bKnPvrqtuAR"),
	il2cpp_current_thread_get_stack_depth: () => Il2Cpp.module.findExportByName("IThAqNGhcex"),
	il2cpp_thread_get_stack_depth: () => Il2Cpp.module.findExportByName("JAJKWJkXuQg"),
	il2cpp_override_stack_backtrace: () => Il2Cpp.module.findExportByName("mTQpCBjdzbZ"),
	il2cpp_type_get_object: () => Il2Cpp.module.findExportByName("koszuVnKXgO"),
	il2cpp_type_get_type: () => Il2Cpp.module.findExportByName("rzXZYqGRDS_"),
	il2cpp_type_get_class_or_element_class: () => Il2Cpp.module.findExportByName("oqpEnpgFLPR"),
	il2cpp_type_get_name: () => Il2Cpp.module.findExportByName("iCQVVfLgpti"),
	il2cpp_type_is_byref: () => Il2Cpp.module.findExportByName("YkuOKqKLnRa"),
	il2cpp_type_get_attrs: () => Il2Cpp.module.findExportByName("oeTUFlZxguO"),
	il2cpp_type_equals: () => Il2Cpp.module.findExportByName("BbKMwURkaBZ"),
	il2cpp_type_get_assembly_qualified_name: () => Il2Cpp.module.findExportByName("xqSuRFCihLe"),
	il2cpp_type_get_reflection_name: () => Il2Cpp.module.findExportByName("oXMBHGUladO"),
	il2cpp_type_is_static: () => Il2Cpp.module.findExportByName("fohUxtDAJkA"),
	il2cpp_type_is_pointer_type: () => Il2Cpp.module.findExportByName("H_uk_ZOAcyY"),
	il2cpp_image_get_assembly: () => Il2Cpp.module.findExportByName("UZxUkcbZMsq"),
	il2cpp_image_get_name: () => Il2Cpp.module.findExportByName("JxemIuPwkeo"),
	il2cpp_image_get_filename: () => Il2Cpp.module.findExportByName("rA_MV_vCNBC"),
	il2cpp_image_get_entry_point: () => Il2Cpp.module.findExportByName("oKleOEGgmEw"),
	il2cpp_image_get_class_count: () => Il2Cpp.module.findExportByName("RuYichYnDjy"),
	il2cpp_image_get_class: () => Il2Cpp.module.findExportByName("vAjEpnsfkRj"),
	il2cpp_capture_memory_snapshot: () => Il2Cpp.module.findExportByName("HMiTsAsShKZ"),
	il2cpp_free_captured_memory_snapshot: () => Il2Cpp.module.findExportByName("xbDnqeYNjkx"),
	il2cpp_set_find_plugin_callback: () => Il2Cpp.module.findExportByName("HHKQNBebmly"),
	il2cpp_register_log_callback: () => Il2Cpp.module.findExportByName("UzmXTzJHusu"),
	il2cpp_debugger_set_agent_options: () => Il2Cpp.module.findExportByName("wQVdLLiuwge"),
	il2cpp_is_debugger_attached: () => Il2Cpp.module.findExportByName("Ch_YMPpMoHw"),
	il2cpp_register_debugger_agent_transport: () => Il2Cpp.module.findExportByName("lIVjzzQkLOG"),
	il2cpp_debug_foreach_method: () => Il2Cpp.module.findExportByName("WavxsPbfful"),
	il2cpp_debug_get_method_info: () => Il2Cpp.module.findExportByName("dFpvLglinUm"),
	il2cpp_unity_install_unitytls_interface: () => Il2Cpp.module.findExportByName("zIsFazwsOGk"),
	il2cpp_custom_attrs_from_class: () => Il2Cpp.module.findExportByName("PLXYrRDQIja"),
	il2cpp_custom_attrs_from_method: () => Il2Cpp.module.findExportByName("BQAfsJFgPKd"),
	il2cpp_custom_attrs_from_field: () => Il2Cpp.module.findExportByName("LxpbFyUBedf"),
	il2cpp_custom_attrs_get_attr: () => Il2Cpp.module.findExportByName("ZpROYUHXATI"),
	il2cpp_custom_attrs_has_attr: () => Il2Cpp.module.findExportByName("jtdUTabHlvI"),
	il2cpp_custom_attrs_construct: () => Il2Cpp.module.findExportByName("HxtMOmuHxyn"),
	il2cpp_custom_attrs_free: () => Il2Cpp.module.findExportByName("zEHXuxUyfiP"),
	il2cpp_class_set_userdata: () => Il2Cpp.module.findExportByName("HeRqqEhMq_K"),
	il2cpp_class_get_userdata_offset: () => Il2Cpp.module.findExportByName("_ABcwGbWqFx"),
	il2cpp_set_default_thread_affinity: () => Il2Cpp.module.findExportByName("AhuXlDhrCRo"),
	il2cpp_unity_set_android_network_up_state_func: () => Il2Cpp.module.findExportByName("IriCLNVXcjZ"),
};
