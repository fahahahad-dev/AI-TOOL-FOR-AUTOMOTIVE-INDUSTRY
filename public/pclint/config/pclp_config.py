#!/usr/bin/env python

##############################################################################
# Copyright Vector Informatik GmbH 2017-2021. All rights reserved.
# Confidential and proprietary. No part of this file may be redistributed
# without express written permission of Vector Informatik GmbH.
#
# This file is provided by Vector Informatik GmbH (https://www.vector.com) for
# use exclusively with PC-lint Plus. Redistribution to and use by licensed
# users is permitted. Any such redistribution must preserve this notice and,
# if the redistributed file has been modified, provide notice that the file
# has been modified from the original.
##############################################################################

from __future__ import print_function
import regex
import yaml
import json
import os
import sys
import subprocess
import argparse
import string
import stat
import tempfile
import ntpath
import shlex
from datetime import datetime

__version__ = "2.2.0"
database_version = ""

debug_dont_show_compiler_errors = False
debug_expect_no_include_directories = False
debug_expect_no_predefined_macros = False
debug_expect_no_size_options = False
debug_show_command = False
debug_show_compiler_relative = False
debug_show_input = False
debug_show_option_alter = False
debug_show_output = False
debug_show_tempfile_cleanup = False
debug_show_tempfile_derived = False
debug_show_trace = False
last_compiler_trace = ""

def splitOptions(args, opts):
    if args.shell_parse_compiler_options:
        return shlex.split(opts, posix=args.posix_command_parsing)
    else:
        return opts.split()

def updateDebuggingInformation(args):
    global debug_dont_show_compiler_errors
    debug_dont_show_compiler_errors = not not (args.debug_dont_show_compiler_errors or os.getenv('PCLP_CONFIG_DONT_SHOW_COMPILER_ERRORS'))
    global debug_expect_no_include_directories
    debug_expect_no_include_directories = not not (args.debug_expect_no_include_directories or os.getenv('PCLP_EXPECT_NO_INCLUDE_DIRECTORIES'))
    global debug_expect_no_predefined_macros
    debug_expect_no_predefined_macros = not not (args.debug_expect_no_predefined_macros or os.getenv('PCLP_EXPECT_NO_PREDEFINED_MACROS'))
    global debug_expect_no_size_options
    debug_expect_no_size_options = not not (args.debug_expect_no_size_options or os.getenv('PCLP_EXPECT_NO_SIZE_OPTIONS'))
    global debug_show_command
    debug_show_command = not not (args.debug_show_command or os.getenv('PCLP_CONFIG_SHOW_COMMAND'))
    global debug_show_compiler_relative
    debug_show_compiler_relative = not not (args.debug_show_compiler_relative or os.getenv('PCLP_CONFIG_SHOW_COMPILER_RELATIVE'))
    global debug_show_input
    debug_show_input = not not (args.debug_show_input or os.getenv('PCLP_CONFIG_SHOW_INPUT'))
    global debug_show_option_alter
    debug_show_option_alter = not not (args.debug_show_option_alter or os.getenv('PCLP_CONFIG_SHOW_OPTION_ALTER'))
    global debug_show_output
    debug_show_output = not not (args.debug_show_output or os.getenv('PCLP_CONFIG_SHOW_OUTPUT'))
    global debug_show_tempfile_cleanup
    debug_show_tempfile_cleanup = not not (args.debug_show_tempfile_cleanup or os.getenv('PCLP_CONFIG_SHOW_TEMPFILE_CLEANUP'))
    global debug_show_tempfile_derived
    debug_show_tempfile_derived = not not (args.debug_show_tempfile_derived or os.getenv('PCLP_CONFIG_SHOW_TEMPFILE_DERIVED'))
    global debug_show_trace
    debug_show_trace = not not (args.debug_show_trace or os.getenv('PCLP_CONFIG_SHOW_TRACE'))


def emit_command(text):
    if debug_show_command:
        sys.stderr.write(text)


def emit_compiler_error(command, std_in, std_out, std_err, tempfilename = None, temp_contents = None):
    if not debug_dont_show_compiler_errors:
        text = "Compiler error while getting " + last_compiler_trace \
            + "\nCommand:\n" \
            + " ".join(command) \
            + "\n"
        if tempfilename:
            text += '\nTemporary file "' + tempfilename + '":\n' + str(temp_contents)
        if std_in:
            text += "\nStdIn:\n" + str(std_in)
        if std_out:
            text += "\nStdOut:\n" + str(std_out)
        if std_err:
            text += "\nStdErr:\n" + str(std_err)
        sys.stderr.write(text + "\n")


def emit_compiler_relative(text):
    if debug_show_compiler_relative:
        sys.stderr.write(text)


def emit_compiler_trace(text):
    global last_compiler_trace
    last_compiler_trace = text
    if debug_show_trace:
        sys.stderr.write("Getting " + text + "\n")


def emit_tempfile_cleanup(text):
    if debug_show_tempfile_cleanup:
        sys.stderr.write(text)


def emit_tempfile_derived(text):
    if debug_show_tempfile_derived:
        sys.stderr.write(text)


def emit_error(text):
    sys.stderr.write("Error: " + text)
    sys.exit(1)


def emit_input(text):
    if debug_show_input:
        sys.stderr.write(text)


def emit_note(text):
    sys.stderr.write("Note: " + text)


def emit_option_alter(text):
    if debug_show_option_alter:
        sys.stderr.write(text)


def emit_output(text):
    if debug_show_output:
        sys.stderr.write(text)


def emit_trace(text):
    if debug_show_trace:
        sys.stderr.write(text)


def emit_warning(text):
    sys.stderr.write("Warning: " + text)


def makeHeaderGuardName(fname):
    prefix = "VECTOR_INFORMATIK_PCLP_"
    fname = ntpath.basename(fname)
    fname = regex.sub(r"[.-]", r"_", fname)
    fname = regex.sub(r"[^[:alnum:]_]", r"", fname)
    return prefix + fname.upper()


def checkDatabaseAndCompiler(config, compiler):
    if 'version' not in config['meta']:
        emit_error("compiler database is invalid\n")
    global database_version
    database_version = config.get('meta', {}).get('version', {})
    if compiler is None:
        emit_error("no --compiler specified\n")
    if not 'compilers' in config:
        emit_error("compiler database doesn't contain any compiler data\n")
    if compiler not in config['compilers'] or 'description' not in config['compilers'][compiler]:
        emit_error("'" + compiler + "' is not recognized for automatic configuration; use the option '--list-compilers' to list compilers in the database (refer to the 'System Configuration' section in chapter 2 of the manual to configure an unknown compiler manually)\n")


def validateArgs(args):
    # Warn about potential mix-up of --compiler-database and --compilation-db
    if args.compiler_database and args.compiler_database.lower().endswith('.json'):
        emit_warning("--compiler-database expects a .yaml file. Perhaps you meant to use --compilation-db instead?\n");
    if args.compilation_db and args.compilation_db.lower().endswith('.yaml'):
        emit_warning("--compilation-db expects a .json file. Perhaps you meant to use --compiler-database instead?\n");

    if args.generate_project_config and not args.imposter_file and not args.compilation_db:
        emit_error("An imposter input file or compilation database must be specified when using --generate-project-config, " +
            "use --imposter-file to specify an imposter file or --compilation-db to specify a compilation database\n")


def processConfig(config_file):
    try:
        config = yaml.load(open(config_file), Loader=yaml.Loader);
        return config
    except yaml.YAMLError as exc:
        emit_error("unable to parse configuration file '" + config_file + "': " + str(exc) + "\n")
    except IOError as exc:
        if not os.path.isabs(config_file):
            # If we didn't find a config file specified with
            # a relative path in the working directory, try
            # again in this script's own directory.
            script_dir = os.path.dirname(os.path.abspath(__file__))
            abs_config = os.path.join(script_dir, config_file)
            try:
                config = yaml.load(open(abs_config), Loader=yaml.Loader);
                return config
            except yaml.YAMLError as exc_abs:
                emit_error("unable to parse configuration file '" + abs_config + "': " + str(exc_abs) + "\n")
            except IOError as exc_abs:
                emit_error("unable to open configuration file '" + config_file + "' in the working directory, '" +
                 os.getcwd() + "', nor in the script directory, '" + script_dir + "': " + str(exc) + ", " + str(exc_abs) + "\n")
        emit_error("unable to open configuration file '" + config_file + "': " + str(exc) + "\n")


def runCommand(command, prog_input=None):
    emit_command("Executing: " + " ".join(command) + "\n")
    # Run a command and return the collected stdout, stderr, and return value
    # Command should be list containing the executable and any arguments
    # prog_input, if provided, is sent to the stdin stream of the program.
    try:
        if prog_input is None:
            child_process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            std_output, std_error = child_process.communicate()
            exit_code = child_process.returncode
            return std_output.decode('utf-8'), std_error.decode('utf-8'), exit_code
        else:
            child_process = subprocess.Popen(command, stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
            std_output, std_error = child_process.communicate(input=prog_input.encode())
            exit_code = child_process.returncode
            return std_output.decode('utf-8'), std_error.decode('utf-8'), exit_code
    except OSError as exc:
        emit_error("unable to execute command '" + " ".join(command) + "': " + str(exc) + "\n")


def listSupportedCompilers(config):
    # Dump the supported compilers and their descriptions to stdout.
    print("{:20}{}".format("Compiler Family", "Description"))
    print("{:20}{}".format("---------------", "-----------"))
    if 'compilers' in config:
        for compiler in sorted(config['compilers']):
            if 'description' in config['compilers'][compiler]:
                #print(compiler, "-", config['compilers'][compiler]['description'])
                print("{:20}{}".format(compiler, config['compilers'][compiler]['description']))


def createTemporaryFile(instructions, suffix = '', default_type = 'c'):
    tempfile_items_key  = 'tempfile_items' + suffix
    tempfile_key = 'tempfile' + suffix
    tempfile_type_key = 'tempfile_type' + suffix
    if tempfile_items_key in instructions:
        # Generate the contents
        contents = ''
        tempfile_header_key = 'tempfile_header' + suffix
        tempfile_transform_key = 'tempfile_transform' + suffix
        tempfile_footer_key = 'tempfile_footer' + suffix
        if tempfile_header_key in instructions:
            contents += instructions[tempfile_header_key]
        tempfile_transform = instructions[tempfile_transform_key]
        for item in instructions[tempfile_items_key]:
            for rule in tempfile_transform:
                item = regex.sub(rule[0], rule[1], item)
            contents += item
        if tempfile_footer_key in instructions:
            contents += instructions[tempfile_footer_key]
    elif tempfile_key in instructions:
        # Read the contents
        contents = instructions[tempfile_key]
    else:
        return None, None

    # Create the temporary file
    file_suffix = '.' + instructions.get(tempfile_type_key, default_type)
    t = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix=file_suffix)
    emit_input("Contents of " + t.name + " is:\n" + contents)
    t.file.write(contents)
    return contents, t.name


# Remove tempfile and associated files as per instructions
def cleanupTempFiles(instructions, tempfilename, suffix = ''):
    if tempfilename is None:
        return

    if os.path.exists(tempfilename):
        emit_tempfile_cleanup("Removing: " + tempfilename + "\n")
        os.remove(tempfilename)

    tempfile_associated_key = 'tempfile_associated' + suffix
    if tempfile_associated_key not in instructions:
        return

    for rule in instructions[tempfile_associated_key]:
        emit_tempfile_cleanup("Rule: " + str(rule) + "\n")
        associated_filename = tempfilename
        associated_filename = regex.sub(rule[0], rule[1], associated_filename)
        if os.path.exists(associated_filename):
            emit_tempfile_cleanup("Deleting: " + associated_filename + "\n")
            os.remove(associated_filename)
        else:
            emit_tempfile_cleanup("Missing: " + associated_filename + "\n")


def getCompilerVersion(config, compiler, exe, args):
    # Run the compiler and extract the version information from it
    version_instructions = config.get('compilers', {}).get(compiler, {}).get('version', {})
    if version_instructions is None:
        emit_warning("don't know how to extract compiler version for this compiler\n")
        return None

    result = None
    tempfilename = None
    temp_contents = None
    emit_compiler_error_message = False
    if 'command' in version_instructions:
        if exe is not None:
            # We need to launch the compiler to extract the version number
            emit_compiler_trace("compiler version")
            command = [exe]
            # Get the user supplied compiler options
            if args.compiler_options_affects_version and args.compiler_options:
                command += splitOptions(args, args.compiler_options)

            command += version_instructions['command']

            temp_contents, tempfilename = createTemporaryFile(version_instructions)
            if tempfilename:
                command.append(tempfilename)

            compiler_input = version_instructions.get('input', '')
            if compiler_input: emit_input("StdInp:\n" + compiler_input)
            std_out, std_err, ret_val = runCommand(command, compiler_input)
            if std_out: emit_output("StdOut:\n" + std_out)
            if std_err: emit_output("StdErr:\n" + std_err)

            result_text = getResultFromChannel(version_instructions, std_out, std_err, tempfilename) + '\n'

            if 'match_expr' in version_instructions:
                search_result = regex.search(version_instructions['match_expr'], result_text, regex.MULTILINE)
                if search_result is None:
                    emit_compiler_error_message = True
                    emit_warning("unable to extract compiler version\n")
                else:
                    result = search_result.group('version')
        else:
            emit_warning("need to specify compiler location with --compiler-bin to extract version information\n")

    if emit_compiler_error_message:
        emit_compiler_error(command, compiler_input, std_out, std_err, tempfilename, temp_contents)
    cleanupTempFiles(version_instructions, tempfilename)
    return str(result).strip()


# Provides the result of a compiler invocation through standard output,
# standard error, or a compiler-generated file with a name derived from
# the name of a temporary input file provided to the compiler.
def getResultFromChannel(instructions, std_out, std_err, tempfilename, suffix = ''):
    result_channel = instructions.get('channel' + suffix)
    if result_channel == 'stderr':
        return std_err
    elif result_channel == 'stdout':
        return std_out
    elif 'tempfile_derived' in result_channel:
        tempfilename_derived = tempfilename
        for rule in result_channel['tempfile_derived']:
            tempfilename_derived = regex.sub(rule[0], rule[1], tempfilename_derived)
        emit_tempfile_derived("rules: " + str(result_channel['tempfile_derived']) + "\n")
        emit_tempfile_derived("tempfilename: " + tempfilename + "\n")
        emit_tempfile_derived("tempfile_derived: " + tempfilename_derived + "\n")
        with open(tempfilename_derived, 'r') as result_file:
            return result_file.read()
    else:
        if result_channel:
            emit_warning("Unrecognized channel '" + result_channel + "' - stdout will be used")
        return std_out


def generateSizeOptions(config, args):
    # Find the instructions for generating PCLP size options for compiler
    # from the configuration database and execute the instructions returning
    # the result.
    compiler = args.compiler
    exe = args.compiler_bin
    size_instructions = config.get('compilers', {}).get(compiler, {}).get('size_options')
    if size_instructions is None:
        emit_note("size options for this compiler cannot be determined automatically, please set size options manually in the generated .lnt file\n")
        return None

    # The presence of 'command' means we should try to extract the information by
    # invoking the compiler.
    if 'command' in size_instructions and exe is not None:
        emit_compiler_trace("size options")
        # We need to launch the compiler to extract the size options
        # The options we pass to the compiler (if any) are stored in 'command'
        # The input sent to the compiler's stdin stream, if any, is in 'input'
        command = [exe]

        # Get the user supplied compiler options
        if args.compiler_options:
            command += splitOptions(args, args.compiler_options)
        # Get the tempfile language specific types
        tempfile_type_c = size_instructions.get('tempfile_type_c', 'c')
        tempfile_type_cpp = size_instructions.get('tempfile_type_cpp', 'cpp')
        # Get the input language specific compiler options
        input_type_option_c = size_instructions.get('input_type_option_c', None)
        input_type_option_cpp = size_instructions.get('input_type_option_cpp', None)
        input_type_option_default = size_instructions.get('input_type_option_default', None)
        # Allowed values for 'option_priority':
        #   c_cpp   Apply C options if supplied else C++ options if supplied
        #   cpp_c   Apply C++ options if supplied else C options if supplied
        #   c       Apply C options if supplied
        #   cpp     Apply C++ options if supplied
        #   ELSE    Do not apply either the C or C++ options
        tempfile_type = tempfile_type_c
        input_type_option = input_type_option_default
        option_priority = size_instructions.get('option_priority', 'cpp_c')
        if 'c_cpp' == option_priority:
            if args.compiler_c_options:
                command += splitOptions(args, args.compiler_c_options)
                tempfile_type = tempfile_type_c
                input_type_option = input_type_option_c
            elif args.compiler_cpp_options:
                command += splitOptions(args, args.compiler_cpp_options)
                tempfile_type = tempfile_type_cpp
                input_type_option = input_type_option_cpp
        elif 'cpp_c' == option_priority:
            if args.compiler_cpp_options:
                command += splitOptions(args, args.compiler_cpp_options)
                tempfile_type = tempfile_type_cpp
                input_type_option = input_type_option_cpp
            elif args.compiler_c_options:
                command += splitOptions(args, args.compiler_c_options)
                tempfile_type = tempfile_type_c
                input_type_option = input_type_option_c
        elif 'c' == option_priority:
            if args.compiler_c_options:
                command += splitOptions(args, args.compiler_c_options)
                tempfile_type = tempfile_type_c
                input_type_option = input_type_option_c
        elif 'cpp' == option_priority:
            if args.compiler_cpp_options:
                command += splitOptions(args, args.compiler_cpp_options)
                tempfile_type = tempfile_type_cpp
                input_type_option = input_type_option_cpp
        if input_type_option:
            command.append(input_type_option)

        # Append the standard compiler options
        if size_instructions['command']:
            command += size_instructions['command']

        result = None
        emit_compiler_error_message = True
        temp_contents, tempfilename = createTemporaryFile(size_instructions, default_type = tempfile_type)
        if tempfilename:
            command.append(tempfilename)
        compiler_input = size_instructions.get('input', '')
        if compiler_input: emit_input("StdInp:\n" + compiler_input)
        std_out, std_err, ret_val = runCommand(command, compiler_input)
        if std_out: emit_output("StdOut:\n" + std_out)
        if std_err: emit_output("StdErr:\n" + std_err)

        result_text = getResultFromChannel(size_instructions, std_out, std_err, tempfilename)

        # 'match_expr' is the pattern to use to extract the size options from
        # the output channel.  If this doesn't exist, we'll just return it all.
        match_expr = size_instructions.get('match_expr')
        if match_expr is None:
            result = result_text
            emit_compiler_error_message = False
        else:
            match_result = regex.search(match_expr, result_text, regex.MULTILINE | regex.DOTALL)
            if match_result is not None:
                if 'size_options' in match_result.groupdict():
                    # The size options should be in a named capture group called 'size_options'
                    matched_portion = match_result.group('size_options')
                    if matched_portion is not None:
                        result = matched_portion
                        emit_compiler_error_message = False
                if emit_compiler_error_message:
                    if {'size_name', 'size_value'} <= set(match_result.groupdict()):
                        matched_names = match_result.captures('size_name')
                        matched_values = match_result.captures('size_value')

                        if len(matched_names) == len(matched_values):
                            size_option_list = zip(matched_names, matched_values)
                            size_options = []
                            for size_name, size_value in size_option_list:
                                size_options.append('-' + size_name + size_value)
                            result = " ".join(size_options)
                            emit_compiler_error_message = False

        if emit_compiler_error_message and not debug_expect_no_size_options:
            emit_compiler_error(command, compiler_input, std_out, std_err, tempfilename, temp_contents)
        cleanupTempFiles(size_instructions, tempfilename)
        return result

    if 'fallback_values' in size_instructions:
        return size_instructions.get('fallback_values')

    if 'command' in size_instructions and exe is None:
        emit_warning("size options could not be extracted because the compiler binary was not provided, please set size options manually in the generated .lnt file or rerun with the --compiler-bin option\n")

    return None


def extractIncludeOptions(config, args, section, additional_options, found_paths):
    compiler = args.compiler
    base_options = splitOptions(args, args.compiler_options)
    exe = args.compiler_bin
    include_path = config.get('compilers', {}).get(compiler, {}).get(section)
    if include_path is None:
        return found_paths

    result_text = ''
    tempfilename = None
    temp_contents = None
    emit_compiler_error_message = False
    if 'command' in include_path:
        emit_compiler_trace("include paths for '" + section + "'")
        emit_compiler_error_message = True
        # We'll be invoking the compiler to paths
        command = [exe]
        if base_options:
            command.extend(base_options)
        if additional_options:
            command.extend(additional_options)
        command.extend(include_path['command'])

        temp_contents, tempfilename = createTemporaryFile(include_path)
        if tempfilename:
            command.append(tempfilename)

        compiler_input = include_path.get('input', '')
        if compiler_input: emit_input("StdInp:\n" + compiler_input)
        std_out, std_err, ret_val = runCommand(command, compiler_input)
        if std_out: emit_output("StdOut:\n" + std_out)
        if std_err: emit_output("StdErr:\n" + std_err)
        result_text = getResultFromChannel(include_path, std_out, std_err, tempfilename)
    elif 'env_var' in include_path:
        emit_trace("Fetching include paths for '" + section + "'\n")
        result_text = os.environ.get(include_path['env_var'], '')
        if not result_text:
            return found_paths
    elif 'compiler_relative' in include_path:
        # 'compiler_relative' contains regular expression translations to convert compiler path
        # to include file directory paths. Each translation that succeeds will be added to the
        # set of header file search directories.
        compiler_bin = args.compiler_bin
        emit_compiler_relative("rules: " + str(include_path['compiler_relative']) + "\n")
        emit_compiler_relative("compiler_bin: " + args.compiler_bin + "\n")
        for rule in include_path['compiler_relative']:
            compiler_relative = regex.sub(rule[0], rule[1], compiler_bin)
            if compiler_bin != compiler_relative:
                emit_compiler_relative("compiler_relative: " + compiler_relative + "\n")
                found_paths.append(compiler_relative)

    # 'match_expr' is the pattern to use to extract the include paths from
    # the output channel.  If this doesn't exist, we'll just continue.
    if result_text:
        match_expr = include_path.get('match_expr')
        if match_expr is not None:
            match_result = regex.search(match_expr, result_text, regex.MULTILINE | regex.DOTALL)
            if match_result is not None:
                # The paths should be in one or more named capture groups called 'include_dir'
                matched_portions = match_result.captures('include_dir')
                if matched_portions is not None:
                    emit_compiler_error_message = False
                    for matched_portion in matched_portions:
                        matched_portion = matched_portion.strip()
                        matched_portion = regex.sub(r"\s+", r" ", matched_portion)
                        if matched_portion not in found_paths:
                            found_paths.append(os.path.normpath(matched_portion))

    if emit_compiler_error_message and not debug_expect_no_include_directories:
        emit_compiler_error(command, compiler_input, std_out, std_err, tempfilename, temp_contents)
    cleanupTempFiles(include_path, tempfilename)

    return found_paths


def generateIncludeOptions(config, args):
    # Find the built-in compiler include paths, typically used to find standard
    # and system headers.  These can reside in 'cpp_include_paths', 'c_include_paths',
    # and 'include_paths'.  Well process all we find, dedupe them, and put them in
    # the order listed above.
    emit_trace("Getting include options\n")
    found_paths = []

    if not args.compiler_bin:
        emit_warning("unable to extract include path information from compiler, use --compiler-bin to specify compiler locations\n")
        return found_paths

    found_paths = extractIncludeOptions(config, args, 'cpp_include_paths', splitOptions(args, args.compiler_cpp_options), found_paths)
    found_paths = extractIncludeOptions(config, args, 'c_include_paths', splitOptions(args, args.compiler_c_options), found_paths)
    found_paths = extractIncludeOptions(config, args, 'include_paths', None, found_paths)

    return found_paths


def disregardedMacroNames():
    disregarded_names = {
            '__DATE__',
            '__TIMESTAMP__',
            '__TIME__',
            }
    return disregarded_names


def ignoredMacroNames():
    ignored_names = {
            '_Pragma',
            '__BASE_FILE__',
            '__COUNTER__',
            '__FILE__',
            '__INCLUDE_LEVEL__',
            '__LINE__',
            '__VA_ARGS__',
            '__cplusplus',
            '__has_attribute',
            '__has_builtin',
            '__has_extension',
            '__has_feature',
            '__has_include',
            '__has_include_next',
            '__has_warning',
            '__is_identifier',
            'and',
            'and_eq',
            'bitand',
            'bitor',
            'compl',
            'define',
            'defined',
            'not',
            'not_eq',
            'or',
            'or_eq',
            'xor',
            'xor_eq',
            }
    return ignored_names


def unsupportedMacroNames(dont_filter):
    unsupported_names = {
            '_CONSTEXPR_CHAR_TRAITS_SUPPORTED',
            '_CRT_USE_BUILTIN_OFFSETOF',
            '_HAS_CHAR16_T_LANGUAGE_SUPPORT',
            '_IS_ASSIGNABLE_NOCHECK_SUPPORTED',
            '_MSVC_EXECUTION_CHARACTER_SET',
            '_MSVC_WARNING_LEVEL',
            }
    # Feature test macros for features not supported by Clang
    #
    # This section will override test macros that are defined in featureTestMacroMaximums()
    if not dont_filter:
        unsupported_names.update({
            '__cpp_auto_cast',                          # 202110 C++23
            '__cpp_consteval',                          # 202110 C++23
            '__cpp_explicit_this_parameter',            # 202110 C++23
            '__cpp_if_consteval',                       # 202106 C++23
            '__cpp_implicit_move',                      # 202207 C++23
            '__cpp_modules',                            # 201907 C++20
            '__cpp_multidimensional_subscript',         # 202211 C++23
            '__cpp_named_character_escapes',            # 202207 C++23
            '__cpp_nontype_template_parameter_class',   # 201806 GCC
            '__cpp_runtime_arrays',                     # 198712 GCC
            '__cpp_size_t_suffix',                      # 202011 C++23
            '__cpp_static_call_operator',               # 202207 C++23
            '__cpp_transactional_memory',               # 201505 GCC
            })
    return unsupported_names


def isCppLanguageFeatureTestMacro(macro_name):
    return macro_name.startswith("__cpp_") and not macro_name.startswith("__cpp_lib_")


# Maximum feature test macro values
#
# If a feature is not supported we include the known value(s) for future reference (it will be overridden 
# by unsupportedMacroNames()).
#
# These macros are from:
#   "Working Draft, Standard for Programming Language C++" (N4950 2023-05-10) table [tab:cpp.predefined.ft],
#   "C++ Standards Support in GCC" (https://gcc.gnu.org/projects/cxx-status.html),
#   "InitPreprocessor.cpp" source file
#
# The limits on these values is based upon our usage of clang version 12
def featureTestMacroMaximums(dont_filter, cpp_standard = 20):
    feature_maximums = {
        '__cpp_aggregate_bases':                    201603,
        '__cpp_aggregate_nsdmi':                    201304,
        '__cpp_aggregate_paren_init':               201902,
        '__cpp_alias_templates':                    200704,
        '__cpp_aligned_new':                        201606,
        '__cpp_attributes':                         200809,
        '__cpp_auto_cast' :                         202110,
        '__cpp_binary_literals':                    201304,
        '__cpp_capture_star_this':                  201603,
        '__cpp_char8_t':                            201811,     # C++20, C++23: 202207
        '__cpp_concepts':                           201907,     # C++20, C++23: 202002
        '__cpp_conditional_explicit':               201806,
        '__cpp_consteval':                          201811,     # C+=20, C++23: 202211
        '__cpp_constexpr':                          201907 if cpp_standard >= 20 else   # C++20, C++23: 202211
                                                    201603 if cpp_standard >= 17 else
                                                    201304 if cpp_standard >= 14 else
                                                    200704,
        '__cpp_constexpr_dynamic_alloc':            201907,
        '__cpp_constexpr_in_decltype':              201711,
        '__cpp_constinit':                          201907,
        '__cpp_coroutines':                         201707,     # Old name
        '__cpp_decltype':                           200707,
        '__cpp_decltype_auto':                      201304,
        '__cpp_deduction_guides':                   201907 if dont_filter else 201703,
        '__cpp_delegating_constructors':            200604,
        '__cpp_designated_initializers':            201707,
        '__cpp_digit_separator':                    201309,     # GCC
        '__cpp_digit_separators':                   201309,     # Clang
        '__cpp_enumerator_attributes':              201411,
        '__cpp_exceptions':                         199711,     # Clang
        '__cpp_explicit_this_parameter':            202110,
        '__cpp_fold_expressions':                   201603,
        '__cpp_generic_lambdas':                    201707 if cpp_standard >= 20 else 201304,
        '__cpp_guaranteed_copy_elision':            201606,
        '__cpp_hex_float':                          201603,
        '__cpp_if_consteval':                       202106,
        '__cpp_if_constexpr':                       201606,
        '__cpp_impl_coroutine':                     201902,
        '__cpp_impl_destroying_delete':             201806,
        '__cpp_impl_three_way_comparison':          201907,
        '__cpp_implicit_move' :                     202207,
        '__cpp_inheriting_constructors':            201511,
        '__cpp_init_captures':                      201803 if cpp_standard >= 20 else 201304,
        '__cpp_initializer_lists':                  200806,
        '__cpp_inline_variables':                   201606,
        '__cpp_lambdas':                            200907,
        '__cpp_modules':                            201907,
        '__cpp_multidimensional_subscript':         202110,
        '__cpp_named_character_escapes' :           202207,
        '__cpp_namespace_attributes':               201411,
        '__cpp_nested_namespace_definitions':       201411,     # GCC
        '__cpp_noexcept_function_type':             201510,
        '__cpp_nontype_template_args':              201911 if dont_filter else 201411,  
        '__cpp_nontype_template_parameter_auto':    201606,
        '__cpp_nontype_template_parameter_class':   201806,     # GCC
        '__cpp_nsdmi':                              200809,
        '__cpp_range_based_for':                    201603 if cpp_standard >= 17 else 200907,   # C++17, C++23: 202211
        '__cpp_raw_strings':                        200710,
        '__cpp_ref_qualifiers':                     200710,
        '__cpp_return_type_deduction':              201304,
        '__cpp_rtti':                               199711,     # Clang
        '__cpp_runtime_arrays':                     198712,     # GCC
        '__cpp_rvalue_references':                  200610,
        '__cpp_size_t_suffix':                      202006,
        '__cpp_sized_deallocation':                 201309,
        '__cpp_static_assert':                      201411 if cpp_standard >= 17 else 200410,
        '__cpp_static_call_operator' :              202207,
        '__cpp_structured_bindings':                201606,
        '__cpp_template_auto':                      201606,     # Old name
        '__cpp_template_template_args':             201611,
        '__cpp_transactional_memory':               201505,     # GCC
        '__cpp_threadsafe_static_init':             200806,
        '__cpp_unicode_characters':                 200704,
        '__cpp_unicode_literals':                   200710,
        '__cpp_user_defined_literals':              200809,
        '__cpp_using_enum':                         201907,
        '__cpp_variable_templates':                 201304,
        '__cpp_variadic_templates':                 200704,
        '__cpp_variadic_using':                     201611,
        }
    return feature_maximums


def extractPotentialMacros(filename, dont_filter):
    "Extract and return a uniq list of potential macro names from file."
    ignored_names = ignoredMacroNames()
    ignored_names.update(disregardedMacroNames())
    ignored_names.update(unsupportedMacroNames(dont_filter))
    names = set()
    try:
        with open(filename, "rb") as f:
            s = ""
            for c in f.read():
                if (c in string.letters + '_') or (s and c in string.digits):
                    s += c
                    continue
                elif s:
                    if s not in ignored_names:
                        names.add(s)
                    s = ""
    except IOError as exc:
        emit_error("unable to scavenge macros from file '" + filename + "': " + str(exc) + "\n")
    return names


def createScavengeData(names):
    # Produce scavenger data for preprocessing
    scavenge_data = ''
    for name in names:
        scavenge_data += ("#ifdef %s\n-d%s{%s}\n#endif\n" % (name, name, name))
    return scavenge_data


def extractScavengeResults(output):
    # Remove anything except -d options from preprocessed scavenger output.
    good_lines = []
    good_pattern = regex.compile(r"^\s*-d")

    for line in output.split('\n'):
        if good_pattern.match(line):
            # Convert to #define
            line = regex.sub(r"^\s*-d(.*?)\{(.*)\}$", r"#define \1 \2", line)
            good_lines.append(line)
    return good_lines


def getMacroDefinitions(suffix, instructions, args, base_options, last_section):
    command_key = 'command' + suffix
    input_key = 'input' + suffix
    match_expr_key = 'match_expr' + suffix
    if command_key not in instructions:
        return ''
    if args.compiler_bin is None:
        emit_warning("unable to extract macro definitions from compiler, use --compiler-bin to specify compiler locations\n")
        return ''

    emit_compiler_trace("captured macros" + suffix)
    command = [args.compiler_bin]
    if base_options:
        command.extend(base_options)
    command.extend(instructions[command_key])

    temp_contents, tempfilename = createTemporaryFile(instructions, suffix = suffix)
    if tempfilename:
        command.append(tempfilename)

    compiler_input = instructions.get(input_key, '')
    if compiler_input: emit_input("StdInp:\n" + compiler_input)
    std_out, std_err, ret_val = runCommand(command, compiler_input)
    if std_out: emit_output("StdOut:\n" + std_out)
    if std_err: emit_output("StdErr:\n" + std_err)

    result_text = getResultFromChannel(instructions, std_out, std_err, tempfilename, suffix = suffix)

    transforms_key = 'transforms' + suffix
    if transforms_key in instructions:
        for transform_pair in instructions[transforms_key]:
            match_pattern, repl_pattern = transform_pair
            while True:
                match_result = regex.search(match_pattern, result_text)
                if match_result:
                    result_text = regex.sub(match_pattern, repl_pattern, result_text)
                else:
                    break

    match_expr = instructions.get(match_expr_key)
    if match_expr is None:
        cleanupTempFiles(instructions, tempfilename, suffix = suffix)
        return result_text

    match_result = regex.search(match_expr, result_text, regex.MULTILINE|regex.DOTALL)
    macros_to_keep = []
    if match_result:
        ignored_names = ignoredMacroNames()
        disregarded_names = disregardedMacroNames()
        unsupported_names = unsupportedMacroNames(args.dont_filter_feature_test_macros)
        feature_maximums = featureTestMacroMaximums(args.dont_filter_feature_test_macros)
        macros = match_result.group('macros')
        good_pattern = regex.compile(r'\s*#define["\s]+(\w+)(?:[\s"]+([-+.xs0-9a-fA-F]+)([lLuU]*))?')
        for line in macros.splitlines():
            m = good_pattern.match(line)
            if not m:
                continue
            macro_name = m.group(1)
            limit_comment = ''
            disable_reason = ''
            # Ignored names
            if macro_name in ignored_names:
                continue
            # Limit feature test macro values - may be disabled below
            elif macro_name in feature_maximums:
                if m.lastindex > 1:
                    feature_max = feature_maximums[macro_name]
                    if int(m.group(2)) > feature_max:
                        line = '#define {} {}{}'.format(macro_name, str(feature_max), m.group(3))
                        limit_comment = '  /* Limited from {} */'.format(m.group(2))
            # Disable unexpected language feature test macros
            elif isCppLanguageFeatureTestMacro(macro_name):
                disable_reason = 'Unexpected '

            # Disable disregarded and unsupported macros
            if not disable_reason:
                if macro_name in disregarded_names:
                    disable_reason = 'Disregarded'
                elif macro_name in unsupported_names:
                    disable_reason = 'Unsupported'
            if disable_reason:
                line = '/* {} {} */'.format(disable_reason, line)
            if limit_comment:
                line += limit_comment
            macros_to_keep.append(line)

    if not macros_to_keep and last_section and not debug_expect_no_predefined_macros:
        emit_compiler_error(command, compiler_input, std_out, std_err, tempfilename, temp_contents)
    cleanupTempFiles(instructions, tempfilename, suffix = suffix)
    return ('\n'.join(macros_to_keep) + '\n') if macros_to_keep else ''


def generateMacroDefinitions(instructions, args, base_options):
    # There are several ways macro definitions may be generated:
    #   'command' - via compiler invocation and pattern matching
    #   'definitions' - explicitly specified
    #   'scavenge' - using the macro scavenger method
    #
    # For 'command', the macro definitions are expected to appear in the
    # output of the invocation, either in 'stdout' or 'stderr' as indicated
    # by 'channel'.  'match_expr' will be used to match the definitions, if
    # present, otherwise the output will be used as-is.
    #
    # For 'definitions', a list of lists is expected where the first item
    # in each list is the definition name, including parameter list for
    # function-like macros, and the second item is the definition, or null
    # for no definition.  E.g.:
    #
    #   [['A', 1], ['B', ''], ['C', null], ['f(a,b)', '(a + b)']]
    #
    # results in the definitions:
    #
    #   #define A 1
    #   #define B
    #   #define C
    #   #define f(a,b) (a + b)
    #
    # For 'scavenge', 'scavenge_files' and/or 'scavenge_dirs', provided
    # on the command line, are used to search for possible macros.
    # A scavenger file is built and passed to the compiler using the
    # preprocessor to expand defined macros and the output is exhumed
    # to dig out and build a macro list.
    #
    # In all cases, a list of macro definitions, one per line, is returned.
    exe = args.compiler_bin
    result = ''

    scavenging = args.scavenge_files or args.scavenge_dirs
    if scavenging and 'scavenge_command' in instructions:
        emit_compiler_trace("scavenged macros")
        scavenge_files = set()
        if args.scavenge_files:
            scavenge_files.update(args.scavenge_files)
        if args.scavenge_dirs:
            for scavenge_dir in args.scavenge_dirs:
                for folder, subs, files in os.walk(scavenge_dir):
                    for filename in files:
                        if args.scavenge_pattern:
                            if not regex.match(args.scavenge_pattern, filename):
                                continue
                        full_path = os.path.join(folder, filename)
                        stat_info = os.stat(full_path)
                        if stat.S_ISREG(stat_info.st_mode):
                            scavenge_files.add(full_path)

        potential_macros = set()
        for scavenge_file in scavenge_files:
            potential_macros.update(extractPotentialMacros(scavenge_file, args.dont_filter_feature_test_macros))

        scavenge_data = createScavengeData(potential_macros)

        command = [exe] + instructions['scavenge_command']
        compiler_input = scavenge_data
        if compiler_input: emit_input("StdInp:\n" + compiler_input)
        std_out, std_err, ret_val = runCommand(command, compiler_input)
        if std_out: emit_output("StdOut:\n" + std_out)
        if std_err: emit_output("StdErr:\n" + std_err)

        result_channel = instructions.get('channel')
        result_text = std_err if result_channel == 'stderr' else std_out
        scavenged_results = extractScavengeResults(result_text)
        if not scavenged_results and not debug_expect_no_predefined_macros:
            emit_compiler_error(command, compiler_input, std_out, std_err)
        result += "\n".join(scavenged_results) + "\n"

    if 'command' in instructions:
        section_index = 0
        macros_to_keep = ''
        last_section = False
        while not macros_to_keep and not last_section:
            last_section = ('command' + str(section_index + 1)) not in instructions
            macros_to_keep += getMacroDefinitions(str(section_index) if section_index else '', instructions, args, base_options, last_section)
            section_index += 1
        result += macros_to_keep

    if 'definitions' in instructions:
        emit_trace("Using static macros definitions\n")
        macro_defs_str = ''
        for definition in instructions['definitions']:
            macro_name, macro_def = definition
            macro_defs_str += '#define ' + macro_name + ' ' + macro_def + "\n"
        result += macro_defs_str

    if 'static' in instructions:
        emit_trace("Using static macro text\n")
        result += instructions['static']

    return result


def generateDecls(config, args):
    # Find the built-in compiler decls.  We can have 'c_decls', 'cpp_decls',
    # and 'decls'.
    compiler = args.compiler

    decls = config.get('compilers', {}).get(compiler, {}).get('decls', {}).get('definitions')
    c_decls = config.get('compilers', {}).get(compiler, {}).get('c_decls', {}).get('definitions')
    cpp_decls = config.get('compilers', {}).get(compiler, {}).get('cpp_decls', {}).get('definitions')

    all_decls = ''
    if decls:
        all_decls += '/* Common decls */\n' + "\n".join(decls) + '\n/* End of common decls */\n\n'
    if c_decls:
        all_decls += '/* C decls */\n#ifndef __cplusplus\n' + "\n".join(c_decls) + '\n#endif /* ifndef __cplusplus */\n/* End of C decls */\n\n'
    if cpp_decls:
        all_decls += '/* C++ decls */\n#ifdef __cplusplus\n' + "\n".join(cpp_decls) + '\n#endif /* ifdef __cplusplus */\n/* End of C++ decls */\n\n'

    return all_decls


def generateMacros(config, args):
    # Find the built-in compiler macros.  We can have 'c_macros', 'cpp_macros',
    # and 'macros'.
    compiler = args.compiler

    macros = config.get('compilers', {}).get(compiler, {}).get('macros')
    c_macros = config.get('compilers', {}).get(compiler, {}).get('c_macros')
    cpp_macros = config.get('compilers', {}).get(compiler, {}).get('cpp_macros')

    all_macro_definitions = ''
    if macros:
        emit_compiler_trace("common macros")
        generic_macro_defs = generateMacroDefinitions(macros, args, splitOptions(args, args.compiler_options))
        if generic_macro_defs:
            all_macro_definitions += '/* Common macros */\n' + generic_macro_defs + '/* End of common macros */\n\n'
    if c_macros:
        emit_compiler_trace("C macros")
        c_macro_defs = generateMacroDefinitions(c_macros, args, splitOptions(args, args.compiler_options) + splitOptions(args, args.compiler_c_options))
        if c_macro_defs:
            all_macro_definitions += '/* C macros */\n#ifndef __cplusplus\n' + c_macro_defs + '#endif /* ifndef __cplusplus */\n/* End of C macros */\n\n'
    if cpp_macros:
        emit_compiler_trace("C++ macros")
        cpp_macro_defs = generateMacroDefinitions(cpp_macros, args, splitOptions(args, args.compiler_options) + splitOptions(args, args.compiler_cpp_options))
        if cpp_macro_defs:
            all_macro_definitions += '/* C++ macros */\n#ifdef __cplusplus\n' + cpp_macro_defs + '#endif /* ifdef __cplusplus */\n/* End of C++ macros */\n\n'
    if not all_macro_definitions:
        if not debug_expect_no_predefined_macros:
            emit_warning("unable to determine predefined macros, these will need to be set manually in the generated .h file\n")
        all_macro_definitions = "// Unable to extract predefined macros.\n\n"
    return all_macro_definitions


def generateBaseOptions(config, args):
    compiler = args.compiler
    base_config = config.get('compilers', {}).get(compiler, {}).get('base_config', {})
    base_options = ""
    for key in sorted(base_config.keys()):
        base_options += "\n//     " + key.title() + "\n"
        for option, annotation in base_config[key]:
            base_options += option
            if annotation:
                base_options += "  // " + annotation
            base_options += "\n"

    return base_options


def generateCompilerConfig(config, args):
    # Report missing expected/required options
    if not args.config_output_header_file:
        emit_warning("no --config-output-header-file specified\n")
    if not args.config_output_lnt_file:
        emit_warning("no --config-output-lnt-file specified\n")
        return

    compiler = args.compiler
    compile_commands = splitOptions(args, args.compiler_options)
    compile_c_commands = splitOptions(args, args.compiler_c_options)
    compile_cpp_commands = splitOptions(args, args.compiler_cpp_options)
    exe = args.compiler_bin

    compiler_entry = config['compilers'][compiler]
    compiler_version = getCompilerVersion(config, compiler, exe, args)

    intro_string = "for '%s' version '%s'.\n   Using the options:    %s\n   C specific options:    %s\n   C++ specific options:  %s\n   Generated on %s with pclp_config version '%s' and database version '%s'.\n" % (compiler, compiler_version, " ".join(compile_commands), " ".join(compile_c_commands), " ".join(compile_cpp_commands), datetime.now().strftime('%Y-%m-%d at %H:%M:%S'), __version__, database_version)

    # Base configuration
    base_string = generateBaseOptions(config, args)
    if base_string is None:
        base_string = "// Unable to generate base compiler options.\n"

    # Size Options
    size_string = generateSizeOptions(config, args)
    if size_string is None:
        if not debug_expect_no_size_options:
            emit_warning("unable to determine size options, these will need to be set manually in the generated .lnt file\n")
        size_string = "// Unable to determine size options.\n"
    else:
        size_string += "\n"

    # Built-in include directories
    if compiler_entry.get("include_paths") == "defer_transformed":
        includes_string = "// See transformed compiler options for include paths\n"
    else:
        include_directories = generateIncludeOptions(config, args)
        if not include_directories:
            if not debug_expect_no_include_directories:
                emit_warning("unable to determine built-in include directories, these will need to be set manually in the generated .lnt file\n")
            includes_string = "// Unable to extract include paths.\n"
        else:
            includes_string = ""
            for include_dir in include_directories:
                includes_string += "--i\"" + include_dir.strip() + "\"\n"
                includes_string += "+libdir(\"" + include_dir.strip() + "\")\n"

    # Built-in macros
    builtin_macros = generateMacros(config, args)
    builtin_decls = generateDecls(config, args)

    # Custom compile commands
    custom_options_string = ""
    compile_options = compile_commands + compile_cpp_commands if compile_cpp_commands else compile_commands + compile_c_commands
    while compile_options:
        transformations, options_consumed = handleCompilerOption(config, compiler, compile_options)
        if transformations:
            transform_str = " ".join(transformations)
            if transform_str:
                custom_options_string += transform_str + " // From: '" + " ".join(compile_options[:options_consumed]) + "'\n"
        compile_options = compile_options[options_consumed:]

    # Generate LNT file
    with open(args.config_output_lnt_file, 'w') as lnt:
        lnt.write("/* Compiler configuration " + intro_string + " */\n")

        # Generate header file
        if args.config_output_header_file:
            header_guard_macro = makeHeaderGuardName(args.config_output_header_file)
            with open(args.config_output_header_file, 'w') as hdr:
                hdr.write('#ifndef ' + header_guard_macro + "\n")
                hdr.write('#define ' + header_guard_macro + "\n")
                hdr.write("/* Predefined compiler macros " + intro_string + " */\n")
                hdr.write("\n")
                hdr.write(builtin_macros)
                hdr.write(builtin_decls)
                hdr.write('#endif /* ifndef ' + header_guard_macro + " */\n")
            header_path = args.config_output_header_file
            if args.header_option_use_enclosing_directory:
                header_path = "%ENCLOSING_DIRECTORY%/" + header_path

            lnt.write("\n\n")
            lnt.write('// Predefined Compiler Macros and Declarations\n')
            lnt.write('+libh(' + header_path + ')\n')
            lnt.write('-header(' + header_path + ')\n')

        # Finish LNT file
        lnt.write("\n\n")
        lnt.write("// Include Options:\n")
        lnt.write(includes_string)

        lnt.write("\n\n")
        lnt.write("// Base Options:\n")
        lnt.write(base_string)

        lnt.write("\n\n")
        lnt.write("// Size Options:\n")
        lnt.write(size_string)

        lnt.write("\n\n")
        lnt.write("// Transformed Compiler Options:\n")
        lnt.write(custom_options_string)


def shouldIncludeModule(module_name, include_patterns, exclude_patterns):
    # Determine whether the specified module should be included in a generated
    # project configuration given the provided inclusion and exclusion patterns.
    should_include = True

    # If include patterns were specified, the module is only included if it
    # matches one of those patterns
    if include_patterns:
        should_include = False

    for pattern in include_patterns:
        if regex.match(pattern, module_name):
            should_include = True
            break

    # The module is excluded if it matches any of the exclude patterns,
    # even if it previously matched an include pattern.
    for pattern in exclude_patterns:
        if regex.match(pattern, module_name):
            should_include = False
            break

    return should_include


def generateProjectConfig(config, args):
    compiler = args.compiler
    source_pattern = args.source_pattern
    imposter_file = args.imposter_file

    if not imposter_file and args.compilation_db:
        return generateProjectConfigFromCompilationDB(config, args)

    imposter_contents = ''
    with open(imposter_file) as f:
        imposter_contents = '[' + ",".join(f.readlines()) + ']'

    compile_commands = yaml.load(imposter_contents, Loader=yaml.Loader)

    output_file = open(args.config_output_lnt_file, 'w')
    output_file.write("+libclass(angle)\n\n")

    for compile_command in compile_commands:
        source_files = []
        options_str = ''
        while compile_command:
            compile_arg = compile_command[0]
            sf_match = regex.match(source_pattern, compile_arg)
            if sf_match:
                if shouldIncludeModule(compile_arg, args.module_include_pattern, args.module_exclude_pattern):
                    source_files.append(compile_arg)
                compile_command.pop(0)
                continue
            transformations, options_consumed = handleCompilerOption(config, compiler, compile_command)
            if transformations:
                transform_str = "\n".join(transformations)
                if transform_str:
                    options_str += transform_str + "\n"
            compile_command = compile_command[options_consumed:]
        if source_files:
            output_file.write("-env_push\n")
            output_file.write(options_str)
            for source_file in source_files:
                output_file.write('"' + source_file + '"\n')
            output_file.write("-env_pop\n\n")

    output_file.close()


def isAbsolutePath(s):
    if not s:
        return False
    if s[0] == '/' or s[0] == '\\':
        return True
    return len(s) > 1 and str.isalpha(s[0]) and s[1] == ':'


def maybeAddPath(target, directory):
    if not directory or isAbsolutePath(target):
        return target
    else:
        return directory + "/" + target


def tryExpandResponseFile(filename, args):
    try:
        with open(filename, 'r') as f:
            return shlex.split(f.read(), posix=args.posix_command_parsing)
    except:
        pass
    return []


def expandResponseFiles(arguments, rsp_prefix, directory, nesting_level, args):
    if nesting_level > 10:
        return arguments

    new_args = []
    candidate = False

    for argument in arguments:
        if candidate:
            candidate = False
            expansion = tryExpandResponseFile(maybeAddPath(argument, directory), args)
            if expansion:
                new_args.extend(expandResponseFiles(expansion, rsp_prefix, directory, nesting_level + 1, args))
            else:
                # We got here by processing two arguments, the first of
                # which was 'rsp_prefix' and the second was 'argument'.
                # Append both back to the new argument list.
                new_args.append(rsp_prefix)
                new_args.append(argument)
        elif argument.startswith(rsp_prefix):
            remainder = argument[len(rsp_prefix):]
            if not remainder:
                candidate = True
                continue
            # The prefix and filename appears as a single argument.
            # Try to extract the arguments from the specified file.
            # Add extracted arguments or, failing that, the original
            # argument, to the new argument list.
            expansion = tryExpandResponseFile(maybeAddPath(remainder, directory), args)
            if expansion:
                new_args.extend(expandResponseFiles(expansion, rsp_prefix, directory, nesting_level + 1, args))
            else:
                new_args.append(argument)
        else:
            new_args.append(argument)

    return new_args


def generateProjectConfigFromCompilationDB(config, args):
    compiler = args.compiler
    source_pattern = args.source_pattern
    compilation_db = args.compilation_db

    compilation_db_contents = ''
    with open(compilation_db) as f:
        compilation_db_contents = f.read()

    compile_commands = json.loads(compilation_db_contents)

    output_file = open(args.config_output_lnt_file, 'w')
    output_file.write("+libclass(angle)\n\n")

    for compile_command in compile_commands:
        # Extract the source file
        if not 'file' in compile_command:
            continue
        source_file = compile_command['file']

        # Extract the directory if provided
        directory = ''
        if 'directory' in compile_command:
            directory = compile_command['directory']

        # Add directory to relative source file path
        source_file = maybeAddPath(source_file, directory)

        # Check source file for matching source_pattern
        sf_match = regex.match(source_pattern, source_file)
        if not sf_match:
            continue

        # Consider module inclusion and exclusion patterns
        if not shouldIncludeModule(source_file, args.module_include_pattern, args.module_exclude_pattern):
            continue

        # Extract the argument list from the invocation
        # This information is expected to be provided as either a list of strings
        # in a field named 'arguments' or as a string in a field named 'command'.
        arguments = []
        if 'arguments' in compile_command:
            arguments = compile_command['arguments']
        elif 'command' in compile_command:
            arguments = shlex.split(compile_command['command'], posix=args.posix_command_parsing)
        else:
            continue

        # Expand response files
        if args.response_file_prefix:
            # If a (non-empty) response file prefix is defined, try to expand
            # response files that are introduced with this prefix.
            rsp_prefix = args.response_file_prefix
            rsp_dir = ''
            if rsp_prefix in args.prefix_directory_options:
                rsp_dir = directory
            arguments = expandResponseFiles(arguments, args.response_file_prefix, rsp_dir, 0, args)

        # Prepend the directory to arguments of specified options that appear
        # to be relative paths.
        if directory and args.prefix_directory_options:
            # candidate is set to True when an option in the prefix_directory_options
            # list is encountered without an suffix, e.g. -I path instead of -Ipath.
            # When True, indicates that the next argument should unconditionally be
            # treated as a path argument and subject to directory prefixing if it does
            # not appear to be an absolute path.
            candidate = False
            for index, argument in enumerate(arguments):
                if candidate:
                    candidate = False
                    if not isAbsolutePath(argument):
                        arguments[index] = directory + "/" + arguments[index]
                        continue
                for option in args.prefix_directory_options:
                    if argument.startswith(option):
                        remainder = argument[len(option):]
                        if not remainder:
                            candidate = True
                            break
                        if not isAbsolutePath(remainder):
                            arguments[index] = option + directory + "/" + remainder

        # Process compiler option transformations
        options_str = ''
        while arguments:
            transformations, options_consumed = handleCompilerOption(config, compiler, arguments)
            if transformations:
                transform_str = "\n".join(transformations)
                if transform_str:
                    options_str += transform_str + "\n"
            arguments = arguments[options_consumed:]

        output_file.write("-env_push\n")
        output_file.write(options_str)
        output_file.write('"' + source_file + '"\n')
        output_file.write("-env_pop\n\n")

    output_file.close()


def handleCompilerOption(config, compiler, option_list):
    # Given a configuration and a compiler, attempt to decode the provided
    # compiler option, mapping it to the corresponding PC-lint option if
    # an appropriate transformation exists.  Returns the transformation
    # (or None) and the number of options consumed.
    compiler_parameters = config.get('compilers', {}).get(compiler, {})
    option_map = compiler_parameters.get('options')
    if option_map is None or not option_list:
        return (None, 1)

    # Get the option and optionally standardize it
    option_str = option_list[0]
    if 'option_alter' in compiler_parameters:
        for match_pattern, repl_pattern in compiler_parameters['option_alter']:
            option_str = regex.sub(match_pattern, repl_pattern, option_str)
        if option_str != option_list[0]:
            emit_option_alter("Option '{}' altered to '{}'\n".format(option_list[0], option_str))

    # Find the longest matching option
    best_match = None
    best_match_size = 0
    for candidate_option in option_map:
        if option_str.startswith(candidate_option):
            if len(candidate_option) > best_match_size:
                best_match = candidate_option
                best_match_size = len(candidate_option)

    if best_match is None:
        # We didn't recognize the option
        return (None, 1)

    found_option_map = option_map[best_match]
    if found_option_map is None:
        return (None, 1)

    if 'transform' in found_option_map:
        return ([found_option_map['transform']], 1)

    if 'transforms' in found_option_map:
        options_consumed = 1
        while True:
            replacements = []
            for transform_pair in found_option_map['transforms']:
                match_pattern, repl_pattern = transform_pair
                replaced_option_str = option_str
                if 'pre_transforms_replacements' in found_option_map:
                    for replacement_pair in found_option_map['pre_transforms_replacements']:
                        replaced_option_str = replaced_option_str.replace(replacement_pair[0], replacement_pair[1])
                match_result = regex.match(match_pattern, replaced_option_str)
                if match_result:
                    replacement = regex.sub(match_pattern, repl_pattern, replaced_option_str)
                    replacements.append(replacement)
            if replacements:
                return (replacements, options_consumed)
            # Didn't match any of the transformation patterns.  Add the next
            # option to the option string to see if we can match with an arg.
            if len(option_list) > options_consumed:
                option_str += " " + option_list[options_consumed]
                options_consumed += 1
            else:
                return (None, 1)

    # Found an option but no transformations exist
    return (None, 1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--list-compilers',
        help='list the supported compilers',
        default=False,
        action='store_true')

    parser.add_argument('--generate-compiler-config',
        help='generate a customized compiler configuration',
        default=False,
        action='store_true')

    parser.add_argument('--generate-project-config',
        help='generate a customized project configuration',
        default=False,
        action='store_true')

    parser.add_argument('--compiler',
        help='the compiler that will be used to generate configurations',
        type=str)

    parser.add_argument('--compiler-bin',
        help='the location of the compiler executable',
        type=str)

    parser.add_argument('--compiler-options',
        help='base compiler options',
        default='')

    parser.add_argument('--compiler-c-options',
        help='base C-specific compiler options',
        default='')

    parser.add_argument('--compiler-cpp-options',
        help='base C++-specific compiler options',
        default='')

    parser.add_argument('--compiler-options-affects-version',
        help="the compiler version is affected by the compiler options",
        default=False,
        action='store_true')

    parser.add_argument('--compiler-database',
        help='the name of the compiler database file',
        default='compilers.yaml')

    parser.add_argument('--repl',
        help="enter compiler options and see the transformations that would be made",
        default=False,
        action='store_true')

    parser.add_argument('--compiler-version',
        help="show the version of the compiler being configured",
        default=False,
        action='store_true')

    parser.add_argument('--source-pattern',
        help="the pattern used to match project source files in compiler invocations",
        default=r'.*\.(c|cpp)$',
        type=str)

    parser.add_argument('--module-exclude-pattern',
        help="the pattern specifying modules to exclude from project configurations",
        default=[],
        type=str,
        action='append')

    parser.add_argument('--module-include-pattern',
        help="the pattern specifying modules to include in project configurations",
        default=[],
        type=str,
        action='append')

    parser.add_argument('--imposter-file',
        help="a file containing compiler invocations logged by the imposter program",
        type=str)

    parser.add_argument('--compilation-db',
        help="a JSON-formatted compiler database file containing compiler invocations",
        type=str)

    parser.add_argument('--prefix-directory-options',
        help="the compiler options for which relative paths should be prefixed by the directory entry in a JSON compilation database",
        default=['-I','/I','@'],
        action='append')

    parser.add_argument('--response-file-prefix',
        help='the prefix of response files referenced in a JSON compilation database',
        default='@')

    parser.add_argument('--posix-command-parsing',
        help='use posix-like shell parsing when processing a JSON compilation database',
        action='store_true',
        dest='posix_command_parsing',
        default=os.name == 'posix')

    parser.add_argument('--no-posix-command-parsing',
        help='do not use posix-like shell parsing when processing a JSON compilation database',
        action='store_false',
        dest='posix_command_parsing')

    parser.add_argument('--shell-parse-compiler-options',
        help='use shell-like parsing when processing arguments to --compiler-options, --compiler-c-options, and --compiler-cpp-options',
        action='store_true',
        dest='shell_parse_compiler_options')

    parser.add_argument('--config-output-lnt-file',
        help="the file to write the configuration to",
        type=str)

    parser.add_argument('--config-output-header-file',
        help="the file to write supplemental configuration data to (macro definitions, etc)",
        type=str)

    parser.add_argument('--scavenge-files',
        help="the list of files to attempt to extract macro information from",
        action='append')

    parser.add_argument('--scavenge-dirs',
        help="the list of directories to recursively process files from to extract macro information from",
        action='append')

    parser.add_argument('--scavenge-pattern',
        help="the regular expression pattern used to match filenames, excluding path, for macro extraction",
        type=str)

    parser.add_argument('--header-option-use-enclosing-directory',
        help="use the built-in %%ENCLOSING_DIRECTORY%% environment variable to provide an 'absolute' path for the compiler configuration -header option",
        default=False,
        action='store_true')

    parser.add_argument('--dont-filter-feature-test-macros',
        help='do not filter the compiler feature test macros',
        default=False,
        action='store_true')

    parser.add_argument('--debug-dont-show-compiler-errors',
        help="do not show compiler invocation and corresponding input/output when an unexpected condition is encountered",
        default=False,
        action='store_true')

    parser.add_argument('--debug-show-command',
        help="show the commands being used to invoked the compiler",
        default=False,
        action='store_true')

    parser.add_argument('--debug-show-input',
        help="show the input being sent to the invoked compiler",
        default=False,
        action='store_true')

    parser.add_argument('--debug-show-output',
        help="show the output received from the invoked compiler",
        default=False,
        action='store_true')

    parser.add_argument('--debug-show-trace',
        help="show the internal processing steps as they are being performed",
        default=False,
        action='store_true')

    parser.add_argument('--debug-show-compiler-relative',
        help="show debugging messages regarding the 'compiler_relative' rules",
        default=False,
        action='store_true')

    parser.add_argument('--debug-show-tempfile-cleanup',
        help="show debugging messages regarding the cleanup of generated temporary files",
        default=False,
        action='store_true')

    parser.add_argument('--debug-show-tempfile-derived',
        help="show debugging messages regarding the 'tempfile_derived' rules",
        default=False,
        action='store_true')

    #
    # These undocument options are used by the testing suite to disable showing of expected compiler errors
    #
    parser.add_argument('--debug-expect-no-include-directories',
        help=argparse.SUPPRESS,
        default=False,
        action='store_true')

    parser.add_argument('--debug-expect-no-predefined-macros',
        help=argparse.SUPPRESS,
        default=False,
        action='store_true')

    parser.add_argument('--debug-expect-no-size-options',
        help=argparse.SUPPRESS,
        default=False,
        action='store_true')

    parser.add_argument('--debug-show-option-alter',
        help="show the altered compiler options",
        default=False,
        action='store_true')

    args = parser.parse_args()
    updateDebuggingInformation(args)
    validateArgs(args)

    handled_task = False

    if args.compiler_version:
        config = processConfig(args.compiler_database)
        checkDatabaseAndCompiler(config, args.compiler)
        print(getCompilerVersion(config, args.compiler, args.compiler_bin, args))
        handled_task = True

    if args.list_compilers:
        config = processConfig(args.compiler_database)
        if not 'compilers' in config:
            emit_error("compiler database doesn't contain any compiler data\n")
        listSupportedCompilers(config)
        handled_task = True

    if args.generate_compiler_config:
        config = processConfig(args.compiler_database)
        checkDatabaseAndCompiler(config, args.compiler)
        generateCompilerConfig(config, args)
        handled_task = True

    if args.generate_project_config:
        config = processConfig(args.compiler_database)
        checkDatabaseAndCompiler(config, args.compiler)
        generateProjectConfig(config, args)
        handled_task = True

    if args.repl:
        config = processConfig(args.compiler_database)
        checkDatabaseAndCompiler(config, args.compiler)
        handled_task = True
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            print(handleCompilerOption(config, args.compiler, line.strip().split()))

    if not handled_task:
        if args.imposter_file or args.compilation_db:
            emit_warning("No work done as no task was requested, did you forget the --generate-project-config option?\n")
        elif args.config_output_lnt_file or args.config_output_header_file:
            emit_warning("No work done as no task was requested, did you forget the --generate-compiler-config option?\n")
        else:
            emit_warning("No work done as no task was requested, use --help for usage.\n")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        emit_error(str(e) + "\n")
