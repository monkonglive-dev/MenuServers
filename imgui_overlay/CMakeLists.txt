cmake_minimum_required(VERSION 3.20)
project(ACExternalOverlay LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)

# Sources
add_executable(overlay WIN32
    src/main.cpp
)

# Include dirs
target_include_directories(overlay PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/external/openvr/headers
    ${CMAKE_CURRENT_SOURCE_DIR}/external/imgui
)

# Libraries
target_link_directories(overlay PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/lib
)

target_link_libraries(overlay PRIVATE
    d3d11
    d3dcompiler
    openvr_api
)

# Copy OpenVR DLL to output
add_custom_command(TARGET overlay POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    "${CMAKE_CURRENT_SOURCE_DIR}/lib/openvr_api.dll"
    "$<TARGET_FILE_DIR:overlay>"
)

# Build instructions:
# 1. Download OpenVR SDK: https://github.com/ValveSoftware/openvr
#    Copy headers to external/openvr/headers/
#    Copy lib/openvr_api.lib and lib/openvr_api.dll to lib/
#
# 2. Download Dear ImGui: https://github.com/ocornut/imgui
#    Copy these files to external/imgui/:
#      imgui.h, imgui.cpp
#      imgui_impl_win32.h, imgui_impl_win32.cpp
#      imgui_impl_dx11.h, imgui_impl_dx11.cpp
#      imgui_draw.cpp, imgui_tables.cpp, imgui_widgets.cpp
#      imgui_internal.h, imstb_rectpack.h, imstb_textedit.h, imstb_truetype.h
#
# 3. Generate project:
#    mkdir build && cd build
#    cmake .. -G "Visual Studio 17 2022" -A x64
#
# 4. Build:
#    cmake --build . --config Release
