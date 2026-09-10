#ifndef VECTOR_INFORMATIK_PCLP_CO_VS2019_H
#define VECTOR_INFORMATIK_PCLP_CO_VS2019_H
/* Predefined compiler macros for 'vs2019' version '19.29.30159'.
   Using the options:    
   C specific options:    
   C++ specific options:  
   Generated on 2025-07-31 at 14:06:40 with pclp_config version '2.2.0' and database version '2.2.0'.
 */

/* C macros */
#ifndef __cplusplus
#define _MSC_EXTENSIONS 1
#define _MSC_BUILD 0
/* Unsupported #define _IS_ASSIGNABLE_NOCHECK_SUPPORTED 1 */
#define _M_IX86_FP 2
#define _MT 1
/* Unsupported #define _MSVC_WARNING_LEVEL 1L */
#define __STDC_HOSTED__ 1
#define _MSC_FULL_VER 192930159
#define _MSC_VER 1929
#define _MSVC_TRADITIONAL 0
#define _M_IX86 600
/* Unsupported #define _MSVC_EXECUTION_CHARACTER_SET 1252 */
#define _INTEGRAL_MAX_BITS 64
#define _WIN32 1
/* */
#define __FUNCDNAME__ "funcname"
#define __FUNCSIG__ "funcsig"
// #define __FUNCTION__ "func"
#define L__FUNCTION__ L"func"
#endif /* ifndef __cplusplus */
/* End of C macros */

/* C++ macros */
#ifdef __cplusplus
#define _CPPRTTI 1
#define __cpp_ref_qualifiers 200710L
#define __cpp_init_captures 201304L
#define __STDCPP_DEFAULT_NEW_ALIGNMENT__ 8u
#define __cpp_rtti 199711L
#define __cpp_decltype_auto 201304L
#define _MSC_EXTENSIONS 1
#define _MSVC_LANG 201402L
#define __cpp_binary_literals 201304L
#define __cpp_constexpr 201304L
#define _MSC_BUILD 0
#define __cpp_attributes 200809L
#define __cpp_inheriting_constructors 200802L
#define __cpp_generic_lambdas 201304L
#define __cpp_variable_templates 201304L
#define __cpp_nsdmi 200809L
#define _NATIVE_WCHAR_T_DEFINED 1
#define __BOOL_DEFINED 1
#define __cpp_sized_deallocation 201309L
#define __cpp_threadsafe_static_init 200806L
/* Unsupported #define _HAS_CHAR16_T_LANGUAGE_SUPPORT 1 */
#define __cpp_initializer_lists 200806L
/* Unsupported #define _IS_ASSIGNABLE_NOCHECK_SUPPORTED 1 */
#define __cpp_static_assert 200410L
#define __cpp_return_type_deduction 201304L
#define __cpp_enumerator_attributes 201411L
#define __cpp_decltype 200707L
#define _M_IX86_FP 2
/* Unsupported #define _CONSTEXPR_CHAR_TRAITS_SUPPORTED 1 */
#define _MT 1
#define _WCHAR_T_DEFINED 1
/* Unsupported #define _MSVC_WARNING_LEVEL 1L */
#define __cpp_alias_templates 200704L
#define __cpp_lambdas 200907L
#define __STDC_HOSTED__ 1
#define __cpp_user_defined_literals 200809L
#define __cpp_rvalue_references 200610L
#define _NATIVE_NULLPTR_SUPPORTED 1
#define __cpp_namespace_attributes 201411L
#define __STDCPP_THREADS__ 1
#define _MSC_FULL_VER 192930159
#define _MSC_VER 1929
#define _MSVC_TRADITIONAL 0
#define __cpp_range_based_for 200907L
#define __cpp_raw_strings 200710L
#define _M_IX86 600
#define __cpp_unicode_literals 200710L
#define __cpp_unicode_characters 200704L
/* Unsupported #define _MSVC_EXECUTION_CHARACTER_SET 1252 */
#define _INTEGRAL_MAX_BITS 64
#define __cpp_aggregate_nsdmi 201304L
#define _WIN32 1
/* Unsupported #define _CRT_USE_BUILTIN_OFFSETOF 1 */
#define __cpp_variadic_templates 200704L
#define __cpp_delegating_constructors 200604L
/* */
#define __FUNCDNAME__ "funcname"
#define __FUNCSIG__ "funcsig"
// #define __FUNCTION__ "func"
#define L__FUNCTION__ L"func"
/* */
// Define replacements for built-in functions that take types
#if _MSVC_LANG >= 202000
    template <class C1, class C2, class T1, class T2>
    constexpr bool __pclp_is_corresponding_member(T1 C1::*, T2 C2::*) {
        static_assert(sizeof(T1*) != sizeof(T2*), "is_corresponding_member is not currently supported by PC-lint Plus");
        return false;
    }
    #define __is_corresponding_member(C1, C2, P1, P2)       __pclp_is_corresponding_member<C1, C2>(P1, P2)
    //
    template <class C, class T>
    constexpr bool __pclp_is_pointer_interconvertible_with_class(T C::*) {
        static_assert(sizeof(C*) != sizeof(T*), "is_pointer_interconvertible_with_class is not currently supported by PC-lint Plus");
        return false;
    }
    #define __is_pointer_interconvertible_with_class(C, P)  __pclp_is_pointer_interconvertible_with_class<C>(P)
    //
    template <class T1, class T2>
    constexpr bool __pclp_is_layout_compatible() {
        static_assert(sizeof(T1*) != sizeof(T2*), "is_layout_compatible is not currently supported by PC-lint Plus");
        return false;
    }
    #define __is_layout_compatible(T1, T2)                  __pclp_is_layout_compatible<T1, T2>()
    //
    template <class BC, class DC>
    constexpr bool __pclp_is_pointer_interconvertible_base_of() {
        static_assert(sizeof(BC*) != sizeof(DC*), "is_pointer_interconvertible_base_of is not currently supported by PC-lint Plus");
        return false;
    }
    #define __is_pointer_interconvertible_base_of(BC, DC)   __pclp_is_pointer_interconvertible_base_of<BC, DC>()
#endif
#endif /* ifdef __cplusplus */
/* End of C++ macros */

/* C decls */
#ifndef __cplusplus
void __assert(_Bool); /*lint !e793 !e955 !e970 !e1904 !e9141 */
#endif /* ifndef __cplusplus */
/* End of C decls */

/* C++ decls */
#ifdef __cplusplus
void __assert(bool);  /*lint !e793 !e955 !e970 !e1904 !e9141 */
#endif /* ifdef __cplusplus */
/* End of C++ decls */

#endif /* ifndef VECTOR_INFORMATIK_PCLP_CO_VS2019_H */
